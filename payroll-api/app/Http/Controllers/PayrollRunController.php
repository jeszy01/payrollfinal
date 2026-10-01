<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Claim;
use App\Models\Employee;
use App\Models\EmployeeLoan;
use App\Models\Enrollment;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Services\ContributionCalculator;
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
                    'hmo' => $p->hmo,
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
        // Cutoff always follows today's date
        $today = now('Asia/Manila');
        $cut = (int) (DB::table('payroll_settings')->value('cutoff_day') ?: 15);
        $first = $today->day <= $cut;
        $data = [
            'periodStart' => $today->copy()->day($first ? 1 : $cut + 1)->format('Y-m-d'),
            'periodEnd' => ($first ? $today->copy()->day($cut) : $today->copy()->endOfMonth())->format('Y-m-d'),
        ];

        if (PayrollRun::where('period_start', $data['periodStart'])
            ->where('period_end', $data['periodEnd'])
            ->where('status', '!=', 'released')->exists()) {
            return response()->json(['message' => 'A payroll for this cutoff is still waiting for approval or release.'], 422);
        }

        // Only attendance not yet included in a payroll run
        $records = AttendanceRecord::whereBetween('date', [$data['periodStart'], $data['periodEnd']])
            ->whereNull('payroll_run_id')->get();

        $open = $records->filter(fn ($r) => DayCalculator::compute($r)['status'] === 'working')->count();
        if ($open > 0) {
            return response()->json([
                'message' => "{$open} attendance record(s) have no time-out yet. Complete them before generating payroll.",
            ], 422);
        }

        $byEmployee = $records->groupBy('employee_id');

        $run = DB::transaction(function () use ($data, $byEmployee, $records) {
            $run = PayrollRun::create([
                'period_start' => $data['periodStart'],
                'period_end' => $data['periodEnd'],
                'status' => 'draft',
            ]);

            $rates = ContributionCalculator::rates();
            $enrollments = Enrollment::with(['hmoPlan', 'companyBenefit'])->get()->groupBy('employee_id');
            $pendingClaims = Claim::where('status', 'approved')->whereNull('payroll_run_id')->get();
            $claimsByEmployee = $pendingClaims->groupBy('employee_id');
            $loans = EmployeeLoan::where('balance', '>', 0)
                ->where('start_date', '<=', $data['periodEnd'])->get()->groupBy('employee_id');

            Employee::with('position')->where('status', 'Active')->get()->each(function ($emp) use ($run, $byEmployee, $rates, $enrollments, $loans, $claimsByEmployee) {
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

                $monthly = (float) ($emp->position->monthly_salary ?? 0);
                $sss = round(ContributionCalculator::employee($monthly, $rates['sss'] ?? null) / 2, 2);
                $philhealth = round(ContributionCalculator::employee($monthly, $rates['philhealth'] ?? null) / 2, 2);
                $pagIbig = round(ContributionCalculator::employee($monthly, $rates['pagibig'] ?? null) / 2, 2);
                                $claims = round((float) $claimsByEmployee->get($emp->id, collect())->sum('amount'), 2);

                $hmo = 0.0;
                $allow = ['transport_allowance' => 0.0, 'rice_allowance' => 0.0];
                foreach ($enrollments->get($emp->id, collect()) as $en) {
                    if ($en->kind === 'hmo' && $en->hmoPlan) {
                        $hmo += $en->hmoPlan->monthly_premium * $en->hmoPlan->employee_share / 100 / 2;
                    }
                    if ($en->kind === 'benefit' && $en->companyBenefit) {
                        $b = $en->companyBenefit;
                        $amt = $b->basis === 'per_day' ? $b->amount * $s['days'] : $b->amount / 2;
                        if (isset($allow[$b->payslip_field])) {
                            $allow[$b->payslip_field] += $amt;
                        }
                    }
                }
                $hmo = round($hmo, 2);

                $loanTotals = ['sss_loan' => 0.0, 'hdmf_loan' => 0.0, 'cash_advance' => 0.0];
                foreach ($loans->get($emp->id, collect()) as $l) {
                    $loanTotals[$l->type] += min($l->amortization, $l->balance);
                }

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
                    'philhealth' => $philhealth,
                    'hmo' => $hmo,
                    'transport_allowance' => round($allow['transport_allowance'], 2),
                    'rice_allowance' => round($allow['rice_allowance'], 2),
                    'sss_loan' => round($loanTotals['sss_loan'], 2),
                    'hdmf_loan' => round($loanTotals['hdmf_loan'], 2),
                    'cash_advance' => round($loanTotals['cash_advance'], 2),
                    'claims' => $claims,
                    'net_pay' => round(
                        $total + $allow['transport_allowance'] + $allow['rice_allowance']
                      - $sss - $philhealth - $pagIbig - $hmo - array_sum($loanTotals) + $claims,
                        2
                    ),
                    'employee_no' => $emp->employee_no,
                ]);
            });

            // Mark attendance as included, so Active resets to zero
            AttendanceRecord::whereIn('id', $records->pluck('id'))->update(['payroll_run_id' => $run->id]);
            Claim::whereIn('id', $pendingClaims->pluck('id'))->update(['payroll_run_id' => $run->id]);

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

    // approved -> released (moves to Archived, loan balances go down)
    public function release(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'approved') {
            return response()->json(['message' => 'Approve the payroll before releasing it.'], 422);
        }
        DB::transaction(function () use ($payrollRun) {
            foreach ($payrollRun->payslips as $p) {
                EmployeeLoan::where('employee_id', $p->employee_id)
                    ->where('balance', '>', 0)
                    ->where('start_date', '<=', $payrollRun->period_end)
                    ->get()
                    ->each(fn ($l) => $l->update(['balance' => max(0, $l->balance - $l->amortization)]));
            }
                Claim::where('payroll_run_id', $payrollRun->id)->update([
                'status' => 'paid',
                'paid_method' => 'payroll',
                'paid_at' => now('Asia/Manila')->toDateString(),
            ]);
            $payrollRun->update(['status' => 'released']);
        });
        return $this->format($payrollRun->load('payslips'));
    }

    // any status; attendance returns to Active, loan balances restored if released
       public function destroy(PayrollRun $payrollRun)
    {
        if ($payrollRun->status === 'released') {
            return response()->json(['message' => 'A released payroll is locked and cannot be deleted.'], 422);
        }
        DB::transaction(function () use ($payrollRun) {
            AttendanceRecord::where('payroll_run_id', $payrollRun->id)->update(['payroll_run_id' => null]);
            Claim::where('payroll_run_id', $payrollRun->id)->update(['payroll_run_id' => null]);
            $payrollRun->payslips()->delete();
            $payrollRun->delete();
        });
        return response()->noContent();
    }
}
