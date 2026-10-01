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
       'hmo' => 'float', 'sl_cash_conversion' => 'float',
    'sss_loan' => 'float', 'hdmf_loan' => 'float',
    'transport_allowance' => 'float', 'rice_allowance' => 'float',
    'sent_at' => 'datetime',
];
}
