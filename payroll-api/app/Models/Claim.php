<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    use HasUuids;

    protected $guarded = [];
    protected $casts = [
        'amount' => 'float',
        'expense_date' => 'date:Y-m-d',
        'paid_at' => 'date:Y-m-d',
        'decided_at' => 'datetime',
    ];
}
