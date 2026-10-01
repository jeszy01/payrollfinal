<?php // HmoPlan.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HmoPlan extends Model
{
    use HasUuids;

    protected $guarded = [];
    protected $casts = ['monthly_premium' => 'float', 'employee_share' => 'float'];
}
