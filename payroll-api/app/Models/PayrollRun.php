<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    use HasUuids;

    protected $fillable = ['period_start', 'period_end', 'status'];
    protected $casts = ['period_start' => 'date:Y-m-d', 'period_end' => 'date:Y-m-d'];

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }
}
