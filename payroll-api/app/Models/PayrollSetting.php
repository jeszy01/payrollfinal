<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    protected $fillable = [
        'shift_start', 'shift_end', 'paid_hours_per_day',
        'overtime_multiplier', 'rounding_minutes',
    ];

    protected $casts = [
        'paid_hours_per_day' => 'float',
        'overtime_multiplier' => 'float',
        'rounding_minutes' => 'integer',
    ];

    /** Iisang row lang ang settings; gagawa ng default kung wala pa. */
    public static function current(): self
    {
        return static::query()->first() ?? static::create([]);
    }
}
