<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'employee_id', 'employee_name', 'date', 'daily_rate', 'rules',
        'time_in', 'time_out', 'absent', 'archived',
        'ot_minutes', 'ot_reason', 'ot_status', 'ot_remarks', 'ot_reviewed_by', 'ot_reviewed_at',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'daily_rate' => 'float',
        'rules' => 'array',
        'absent' => 'boolean',
        'archived' => 'boolean',
        'ot_minutes' => 'integer',
        'ot_reviewed_at' => 'datetime',
    ];
}
