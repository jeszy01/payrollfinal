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
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'daily_rate' => 'float',
        'rules' => 'array',
        'absent' => 'boolean',
        'archived' => 'boolean',
    ];
}
