<?php

namespace App\Http\Controllers;

use App\Models\PayrollSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private function format(PayrollSetting $s): array
    {
        return [
            'shiftStart' => $s->shift_start,
            'shiftEnd' => $s->shift_end,
            'paidHoursPerDay' => $s->paid_hours_per_day,
            'overtimeMultiplier' => $s->overtime_multiplier,
            'roundingMinutes' => $s->rounding_minutes,
            'workingDaysPerMonth' => $s->working_days_per_month,
            'cutoffDay' => $s->cutoff_day,
        ];
    }

    public function show()
    {
        return $this->format(PayrollSetting::current());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'shiftStart' => 'sometimes|date_format:H:i',
            'shiftEnd' => 'sometimes|date_format:H:i',
            'paidHoursPerDay' => 'sometimes|numeric|min:0|max:24',
            'overtimeMultiplier' => 'sometimes|numeric|min:1|max:5',
            'roundingMinutes' => 'sometimes|integer|min:1|max:60',
            'workingDaysPerMonth' => 'sometimes|integer|min:1|max:31',
            'cutoffDay' => 'sometimes|integer|min:1|max:28',
        ]);

        $map = [
            'shiftStart' => 'shift_start',
            'shiftEnd' => 'shift_end',
            'paidHoursPerDay' => 'paid_hours_per_day',
            'overtimeMultiplier' => 'overtime_multiplier',
            'roundingMinutes' => 'rounding_minutes',
            'workingDaysPerMonth' => 'working_days_per_month',
            'cutoffDay' => 'cutoff_day',
        ];

        $settings = PayrollSetting::current();

        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $settings->{$column} = $data[$input];
            }
        }

        $settings->save();

        return $this->format($settings);
    }
}
