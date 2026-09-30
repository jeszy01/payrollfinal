<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdjustmentRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'type', 'employee_id', 'position_id', 'new_position_id',
        'old_salary', 'new_salary', 'reason', 'status', 'decided_at',
    ];

    protected $casts = ['old_salary' => 'float', 'new_salary' => 'float', 'decided_at' => 'datetime'];
}
