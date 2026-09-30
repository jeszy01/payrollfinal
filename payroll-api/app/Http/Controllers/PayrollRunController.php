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

        if (PayrollRun::where('period_start', $data['periodStart'])->where('period_end', $data['periodEnd'])->exists()) {
            return response()->json(['message' => 'Payroll for this period already exists.'], 422);
        }

        $run = DB::transaction(function () use ($data) {
        $run = PayrollRun::create([
    'period_start' => $data['periodStart'],
    'period_end' => $data['periodEnd'],
    'status' => 'draft',
]);

            $records = AttendanceRecord::whereBetween('date', [$data['periodStart'], $data['periodEnd']])
                ->get()->groupBy('employee_id');

            Employee::with('position')->where('status', 'Active')->get()->each(function ($emp) use ($run, $records) {
                $s = ['days' => 0, 'late' => 0, 'under' => 0, 'over' => 0, 'absences' => 0, 'gross' => 0.0, 'deduction' => 0.0, 'otPay' => 0.0];

                foreach ($records->get($emp->id, collect()) as $r) {
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
                $sss = 0; $pagIbig = 0; $claims = 0; // susunod na step

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
                ]);
            });

            return $run;
        });

        return response()->json($this->format($run->load('payslips')), 201);
    }
}
