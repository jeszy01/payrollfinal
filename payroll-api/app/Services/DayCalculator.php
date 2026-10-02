<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use Illuminate\Support\Facades\DB;

class DayCalculator
{
    private static ?array $holidays = null;

    /** Holiday on a date: ['type' => regular|special, 'multiplier' => float] or null. */
    public static function holidayOn($date): ?array
    {
        if (self::$holidays === null) {
            self::$holidays = [];
            foreach (DB::table('holidays')->get(['date', 'type', 'multiplier']) as $h) {
                self::$holidays[substr((string) $h->date, 0, 10)] = [
                    'type' => $h->type,
                    'multiplier' => (float) $h->multiplier,
                ];
            }
        }
        return self::$holidays[$date->format('Y-m-d')] ?? null;
    }

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

        $rules = $r->rules ?: [];
        $end = $rules['shiftEnd'] ?? '17:00';
        $threshold = (int) ($rules['otThresholdMinutes'] ?? 5); // 5 = for old records saved before this setting existed
        $over = self::mins($r->time_out) - self::mins($end);

        return $over > $threshold ? $over : 0;
    }

    /**
     * Set the OT fields on the record (does not save).
     * Returns false when OT exists but no reason was given (caller should return 422).
     */
  /**
 * Set the OT fields on the record (does not save).
 * OT always becomes pending; the reason is optional.
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

    // Same OT as before: keep the existing review state.
    if ($r->ot_status && (int) $r->ot_minutes === $ot) {
        return true;
    }

    $reason = trim((string) $reason);

    $r->ot_minutes = $ot;
    $r->ot_reason = $reason !== '' ? $reason : null;
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

        $holiday = self::holidayOn($r->date);
        $hMult = $holiday ? max(1.0, $holiday['multiplier']) : 1.0;

        $rate = (float) ($r->daily_rate ?? 0);
        $hourly = $paidHours > 0 ? $rate / $paidHours : 0;

        $roundUp = function (int $m) use ($rounding) {
            $m = max(0, $m);
            return $rounding > 0 ? (int) (ceil($m / $rounding) * $rounding) : $m;
        };
        $cost = fn (int $m) => ($m / 60) * $hourly;

        $zero = [
            'late' => 0, 'under' => 0, 'over' => 0, 'absences' => 0,
            'deduction' => 0.0, 'otPay' => 0.0, 'otStatus' => $r->ot_status,
            'holiday' => $holiday['type'] ?? null, 'holidayPay' => 0.0,
        ];

        if ($r->absent || ! $r->time_in) {
            // Regular holiday: paid even if not worked.
            if ($holiday && $holiday['type'] === 'regular') {
                return ['status' => 'holiday'] + $zero;
            }
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
        $deduction = round(min($rate, $cost($late + $under)), 2);

        return ['status' => 'final'] + array_merge($zero, [
            'late' => $late,
            'under' => $under,
            'over' => $over,
            'deduction' => $deduction,
            // Holiday premium on the paid part of the day (200% regular, 130% special).
            'holidayPay' => $holiday ? round(max(0, $rate - $deduction) * ($hMult - 1), 2) : 0.0,
            // Only APPROVED OT is paid; on a holiday the holiday multiplier applies too.
            'otPay' => $approved ? round($cost($over) * $hMult * $otMultiplier, 2) : 0.0,
        ]);
    }
}
