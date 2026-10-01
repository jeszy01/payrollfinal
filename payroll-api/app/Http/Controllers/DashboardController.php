<?php

namespace App\Http\Controllers;

use App\Models\Adjustment;
use App\Models\Claim;
use App\Models\Employee;
use App\Models\Enrollment;
use App\Models\PayrollRun;
use App\Models\Payslip;

class DashboardController extends Controller
{
    private function label(PayrollRun $r): string
    {
        $s = $r->period_start;
        $e = $r->period_end;
        return $s->format('M j') . '–' . ($s->month === $e->month ? $e->format('j') : $e->format('M j'));
    }

    public function index()
    {
        $active = Employee::with('position')->where('status', 'Active')->get();

        $byDepartment = $active
            ->groupBy(fn ($e) => $e->position->department ?? 'Unassigned')
            ->map(fn ($g, $dept) => ['label' => $dept, 'value' => $g->count()])
            ->sortByDesc('value')->values();

        $runs = PayrollRun::orderByDesc('created_at')->take(6)->get();
        $totals = Payslip::whereIn('payroll_run_id', $runs->pluck('id'))
            ->selectRaw('payroll_run_id, sum(gross) as gross, sum(net_pay) as net, sum(deduction + sss + philhealth + pag_ibig + hmo + sss_loan + hdmf_loan + cash_advance) as deductions')
            ->groupBy('payroll_run_id')->get()->keyBy('payroll_run_id');

        $history = $runs->reverse()->values()->map(function ($r) use ($totals) {
            $t = $totals->get($r->id);
            return ['label' => $this->label($r), 'gross' => (float) ($t?->gross ?? 0), 'net' => (float) ($t?->net ?? 0)];
        });

        $latestData = null;
        $deductions = [];
        if ($latest = $runs->first()) {
            $t = $totals->get($latest->id);
            $latestData = [
                'label' => $this->label($latest),
                'status' => $latest->status,
                'gross' => (float) ($t?->gross ?? 0),
                'net' => (float) ($t?->net ?? 0),
                'deductions' => (float) ($t?->deductions ?? 0),
            ];
            $d = Payslip::where('payroll_run_id', $latest->id)->selectRaw(
                'sum(sss) as sss, sum(philhealth) as philhealth, sum(pag_ibig) as pag_ibig, sum(hmo) as hmo, '
                . 'sum(sss_loan + hdmf_loan + cash_advance) as loans, sum(deduction) as attendance'
            )->first();
            $deductions = [
                ['label' => 'SSS', 'value' => (float) ($d->sss ?? 0)],
                ['label' => 'PhilHealth', 'value' => (float) ($d->philhealth ?? 0)],
                ['label' => 'Pag-IBIG', 'value' => (float) ($d->pag_ibig ?? 0)],
                ['label' => 'HMO', 'value' => (float) ($d->hmo ?? 0)],
                ['label' => 'Loans & advances', 'value' => (float) ($d->loans ?? 0)],
                ['label' => 'Late & undertime', 'value' => (float) ($d->attendance ?? 0)],
            ];
        }

        $claims = Claim::selectRaw('status, count(*) as n, sum(amount) as total')->groupBy('status')->get()->keyBy('status');
        $claim = fn ($s) => ['count' => (int) ($claims->get($s)?->n ?? 0), 'amount' => (float) ($claims->get($s)?->total ?? 0)];

        return [
            'employees' => [
                'active' => $active->count(),
                'total' => Employee::count(),
                'byDepartment' => $byDepartment,
            ],
            'payroll' => [
                'latest' => $latestData,
                'history' => $history,
                'deductions' => $deductions,
                'draft' => PayrollRun::where('status', 'draft')->count(),
                'approved' => PayrollRun::where('status', 'approved')->count(),
            ],
            'claims' => [
                'pending' => $claim('pending'),
                'approved' => $claim('approved'),
                'rejected' => $claim('rejected'),
                'paid' => $claim('paid'),
            ],
            'adjustmentsPending' => Adjustment::where('status', 'pending')->count(),
            'hmo' => [
                'enrolled' => Enrollment::where('kind', 'hmo')
                    ->whereIn('employee_id', $active->pluck('id'))
                    ->distinct()->count('employee_id'),
            ],
        ];
    }
}
