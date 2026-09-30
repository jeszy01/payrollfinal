<?php

namespace App\Services;

use App\Models\AttendanceRecord;

class DayCalculator
{
    private static function mins(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));
        return $h * 60 + $m;
    }

    public static function compute(AttendanceRecord $r): array
    {
        $rules = $r->rules ?: [];
        $start = $rules['shiftStart'] ?? '08:00';
        $end = $rules['shiftEnd'] ?? '17:00';
        $paidHours = (float) ($rules['paidHoursPerDay'] ?? 8);
        $otMultiplier = (float) ($rules['overtimeMultiplier'] ?? 1.25);
        $rounding = (int) ($rules['roundingMinutes'] ?? 60);

        $rate = (float) ($r->daily_rate ?? 0);
        $hourly = $paidHours > 0 ? $rate / $paidHours : 0;

        $roundUp = function (int $m) use ($rounding) {
            $m = max(0, $m);
            return $rounding > 0 ? (int) (ceil($m / $rounding) * $rounding) : $m;
        };
        $cost = fn (int $m) => ($m / 60) * $hourly;

        $zero = ['late' => 0, 'under' => 0, 'over' => 0, 'absences' => 0, 'deduction' => 0.0, 'otPay' => 0.0];

        if ($r->absent || ! $r->time_in) {
            return ['status' => 'absent'] + array_merge($zero, ['absences' => 1, 'deduction' => round($rate, 2)]);
        }

        $late = $roundUp(self::mins($r->time_in) - self::mins($start));

        if (! $r->time_out) {
            return ['status' => 'working'] + array_merge($zero, [
                'late' => $late,
                'deduction' => round(min($rate, $cost($late)), 2),
            ]);
        }

        $under = $roundUp(self::mins($end) - self::mins($r->time_out));
        $over = $roundUp(self::mins($r->time_out) - self::mins($end));

        return ['status' => 'final'] + array_merge($zero, [
            'late' => $late,
            'under' => $under,
            'over' => $over,
            'deduction' => round(min($rate, $cost($late + $under)), 2),
            'otPay' => round($cost($over) * $otMultiplier, 2),
        ]);
    }
}
