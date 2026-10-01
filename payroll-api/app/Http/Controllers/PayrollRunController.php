<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Services\DayCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollRunController extends Controller
{
    private function format(PayrollRun $run): array
    {
        return [
            'id' => $run->id,
            'periodStart' => $run->period_start->format('Y-m-d'),
            'periodEnd' => $run->period_end->format('Y-m-d'),
            'status' => $run->status,
            'payslips' => $run->relationLoaded('payslips')
                ? $run->payslips->sortBy('employee_name')->values()->map(fn ($p) => [
                    'id' => $p->id,
                    'employeeId' => $p->employee_id,
                    'employeeName' => $p->employee_name,
                    'daysWorked' => $p->days_worked,
                    'lateMinutes' => $p->late_minutes,
                    'undertimeMinutes' => $p->undertime_minutes,
                    'overtimeMinutes' => $p->overtime_minutes,
                    'absences' => $p->absences,
                    'gross' => $p->gross,
                    'deduction' => $p->deduction,
                    'overtimePay' => $p->overtime_pay,
                    'sss' => $p->sss,
                    'pagIbig' => $p->pag_ibig,
                    'claims' => $p->claims,
                    'employeeNo' => $p->employee_no,
                    'slCashConversion' => $p->sl_cash_conversion,
                    'philhealth' => $p->philhealth,
                    'cashAdvance' => $p->cash_advance,
                    'sssLoan' => $p->sss_loan,
                    'hdmfLoan' => $p->hdmf_loan,
                    'transportAllowance' => $p->transport_allowance,
                    'riceAllowance' => $p->rice_allowance,
                    'netPay' => $p->net_pay,
                    'sentAt' => $p->sent_at,
                ]) : null,
        ];
    }

    public function index()
    {
        return PayrollRun::orderByDesc('period_start')->get()->map(fn ($r) => $this->format($r));
    }

    public function show(PayrollRun $payrollRun)
    {
        return $this->format($payrollRun->load('payslips'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'periodStart' => 'required|date_format:Y-m-d',
            'periodEnd' => 'required|date_format:Y-m-d|after_or_equal:periodStart',
        ]);

        // Any overlap, not just an exact match
        if (PayrollRun::where('period_start', '<=', $data['periodEnd'])
            ->where('period_end', '>=', $data['periodStart'])->exists()) {
            return response()->json(['message' => 'This period overlaps an existing payroll run.'], 422);
        }

        $records = AttendanceRecord::whereBetween('date', [$data['periodStart'], $data['periodEnd']])->get();

        // Timed in but not timed out yet
        $open = $records->filter(fn ($r) => DayCalculator::compute($r)['status'] === 'working')->count();
        if ($open > 0) {
            return response()->json([
                'message' => "{$open} attendance record(s) have no time-out yet. Complete them before generating payroll.",
            ], 422);
        }

        $byEmployee = $records->groupBy('employee_id');

        $run = DB::transaction(function () use ($data, $byEmployee) {
            $run = PayrollRun::create([
                'period_start' => $data['periodStart'],
                'period_end' => $data['periodEnd'],
                'status' => 'draft',
            ]);

            Employee::with('position')->where('status', 'Active')->get()->each(function ($emp) use ($run, $byEmployee) {
                $s = ['days' => 0, 'late' => 0, 'under' => 0, 'over' => 0, 'absences' => 0, 'gross' => 0.0, 'deduction' => 0.0, 'otPay' => 0.0];

                foreach ($byEmployee->get($emp->id, collect()) as $r) {
                    $c = DayCalculator::compute($r);
                    if ($c['status'] !== 'absent') {
                        $s['days']++;
                        $s['gross'] += $r->daily_rate ?? $emp->daily_rate;
                        $s['deduction'] += $c['deduction'];
                    }
                    $s['late'] += $c['late'];
                    $s['under'] += $c['under'];
                    $s['over'] += $c['over'];
                    $s['absences'] += $c['absences'];
                    $s['otPay'] += $c['otPay'];
                }

                $total = round(max(0, $s['gross'] - $s['deduction']) + $s['otPay'], 2);
                $sss = 0; $pagIbig = 0; $claims = 0; // next step

                Payslip::create([
                    'payroll_run_id' => $run->id,
                    'employee_id' => $emp->id,
                    'employee_name' => $emp->name,
                    'days_worked' => $s['days'],
                    'late_minutes' => $s['late'],
                    'undertime_minutes' => $s['under'],
                    'overtime_minutes' => $s['over'],
                    'absences' => $s['absences'],
                    'gross' => round($s['gross'], 2),
                    'deduction' => round($s['deduction'], 2),
                    'overtime_pay' => round($s['otPay'], 2),
                    'sss' => $sss,
                    'pag_ibig' => $pagIbig,
                    'claims' => $claims,
                    'net_pay' => round($total - $sss - $pagIbig - $claims, 2),
                    'employee_no' => $emp->employee_no,
                ]);
            });

            return $run;
        });

        return response()->json($this->format($run->load('payslips')), 201);
    }

    // draft -> approved
    public function approve(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'draft') {
            return response()->json(['message' => 'Only a draft payroll can be approved.'], 422);
        }
        $payrollRun->update(['status' => 'approved']);
        return $this->format($payrollRun->load('payslips'));
    }

    // approved -> released (this is what shows under Archived)
    public function release(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'approved') {
            return response()->json(['message' => 'Approve the payroll before releasing it.'], 422);
        }
        $payrollRun->update(['status' => 'released']);
        return $this->format($payrollRun->load('payslips'));
    }

    // drafts only
    public function destroy(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'draft') {
            return response()->json(['message' => 'Only a draft payroll can be deleted.'], 422);
        }
        DB::transaction(function () use ($payrollRun) {
            $payrollRun->payslips()->delete();
            $payrollRun->delete();
        });
        return response()->noContent();
    }
}
