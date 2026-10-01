<?php // Enrollment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function hmoPlan(): BelongsTo
    {
        return $this->belongsTo(HmoPlan::class);
    }

    public function companyBenefit(): BelongsTo
    {
        return $this->belongsTo(CompanyBenefit::class);
    }
}
