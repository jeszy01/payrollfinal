<?php

namespace App\Services;

use App\Models\AttendanceRecord;

class DayCalculator
{
    /** OT starts only when time-out is MORE than this many minutes past shift end (6+ min). */
    public const OT_THRESHOLD_MINUTES = 5;

    private static function mins(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));
        return $h * 60 + $m;
    }

    /** Raw OT minutes (no rounding). 0 if within threshold or no time-out. */
    public static function overtimeMinutes(AttendanceRecord $r): int
    {
        if (! $r->time_out || $r->absent) {
            return 0;
        }

        $end = ($r->rules ?: [])['shiftEnd'] ?? '17:00';
        $over = self::mins($r->time_out) - self::mins($end);

        return $over > self::OT_THRESHOLD_MINUTES ? $over : 0;
    }

    /**
     * Set the OT fields on the record (does not save).
     * Returns false when OT exists but no reason was given (caller should return 422).
     */
    public static function applyOvertime(AttendanceRecord $r, ?string $reason): bool
    {
        $ot = self::overtimeMinutes($r);

        if ($ot === 0) {
            $r->ot_minutes = 0;
            $r->ot_reason = null;
            $r->ot_status = null;
            $r->ot_remarks = null;
            $r->ot_reviewed_by = null;
            $r->ot_reviewed_at = null;
            return true;
        }

        $reason = trim((string) $reason);

        // Same OT as before and no new reason: keep existing review state.
        if ($reason === '' && $r->ot_status && (int) $r->ot_minutes === $ot) {
            return true;
        }

        if ($reason === '') {
            return false;
        }

        $r->ot_minutes = $ot;
        $r->ot_reason = $reason;
        $r->ot_status = 'pending';
        $r->ot_remarks = null;
        $r->ot_reviewed_by = null;
        $r->ot_reviewed_at = null;

        return true;
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

        $zero = ['late' => 0, 'under' => 0, 'over' => 0, 'absences' => 0, 'deduction' => 0.0, 'otPay' => 0.0, 'otStatus' => $r->ot_status];

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
        $over = self::overtimeMinutes($r); // raw minutes, not rounded
        $approved = $r->ot_status === 'approved';

        return ['status' => 'final'] + array_merge($zero, [
            'late' => $late,
            'under' => $under,
            'over' => $over,
            'deduction' => round(min($rate, $cost($late + $under)), 2),
            // Only APPROVED OT is paid.
            'otPay' => $approved ? round($cost($over) * $otMultiplier, 2) : 0.0,
        ]);
    }
}
