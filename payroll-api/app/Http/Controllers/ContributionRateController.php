<?php

namespace App\Http\Controllers;

use App\Models\ContributionRate;
use Illuminate\Http\Request;

class ContributionRateController extends Controller
{
    public function index()
    {
        foreach (['sss', 'philhealth', 'pagibig'] as $t) {
            ContributionRate::firstOrCreate(['type' => $t]);
        }
        return ContributionRate::orderBy('type')->get()->map(fn ($r) => $this->format($r));
    }

    public function update(Request $r, string $type)
    {
        abort_unless(in_array($type, ['sss', 'philhealth', 'pagibig']), 404);
        $data = $r->validate([
            'employee_rate' => 'required|numeric|min:0|max:100',
            'employer_rate' => 'required|numeric|min:0|max:100',
            'min_base' => 'required|numeric|min:0',
            'max_base' => 'nullable|numeric|gte:min_base',
            'step' => 'nullable|numeric|min:0',
        ]);
               return $this->format(ContributionRate::updateOrCreate(['type' => $type], $data));
    }

    private function format(ContributionRate $r): array
    {
        return [
            'type' => $r->type,
            'employeeRate' => (float) $r->employee_rate,
            'employerRate' => (float) $r->employer_rate,
            'minBase' => (float) $r->min_base,
            'maxBase' => $r->max_base !== null ? (float) $r->max_base : null,
            'step' => $r->step !== null ? (float) $r->step : null,
        ];
    }
}
