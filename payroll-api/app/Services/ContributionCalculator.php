<?php

namespace App\Services;

use App\Models\ContributionRate;

class ContributionCalculator
{
    public static function rates(): array
    {
        return ContributionRate::all()->keyBy('type')->all();
    }

    public static function employee(float $monthly, ?ContributionRate $r): float
    {
        if (! $r) {
            return 0.0;
        }
        $base = max($monthly, (float) $r->min_base);
        if ($r->max_base !== null) {
            $base = min($base, (float) $r->max_base);
        }
        $step = (float) $r->step;
        if ($step > 0) {
            $base = round($base / $step) * $step;
        }
        return round($base * (float) $r->employee_rate / 100, 2);
    }
}
