<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use HasUuids;

    public const WORKING_DAYS_PER_MONTH = 22;

    protected $fillable = [
        'employee_no', 'name', 'email', 'phone', 'position_id',
        'status', 'employment_type', 'civil_status', 'date_hired',
    ];

    protected $casts = ['date_hired' => 'date:Y-m-d'];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function getBaseSalaryAttribute(): float
    {
        return (float) $this->position->monthly_salary;
    }

    public function getDailyRateAttribute(): float
    {
        return round($this->base_salary / self::WORKING_DAYS_PER_MONTH, 2);
    }
}
