<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContributionRate extends Model
{
    protected $fillable = ['type', 'employee_rate', 'employer_rate', 'min_base', 'max_base', 'step'];
}
