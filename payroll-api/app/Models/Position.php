<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'department', 'grade_code', 'monthly_salary'];

    protected $casts = ['monthly_salary' => 'float'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
