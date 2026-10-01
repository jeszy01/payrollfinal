<?php // EmployeeLoan.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeLoan extends Model
{
    use HasUuids;

    protected $guarded = [];
    protected $casts = [
        'principal' => 'float', 'amortization' => 'float', 'balance' => 'float',
        'start_date' => 'date:Y-m-d',
    ];
}
