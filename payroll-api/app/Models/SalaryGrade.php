<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalaryGrade extends Model
{
    use HasUuids;

    protected $fillable = ['code', 'name', 'monthly_salary'];

    protected $casts = ['monthly_salary' => 'float'];
}
