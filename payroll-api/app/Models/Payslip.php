<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    use HasUuids;

    protected $guarded = [];
    protected $casts = [
        'gross' => 'float', 'deduction' => 'float', 'overtime_pay' => 'float',
        'sss' => 'float', 'pag_ibig' => 'float', 'claims' => 'float', 'net_pay' => 'float',
        'sent_at' => 'datetime',
    ];
}
