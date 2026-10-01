<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ClaimType extends Model
{
    use HasUuids;

    protected $guarded = [];
    protected $casts = ['max_amount' => 'float', 'deadline_days' => 'integer', 'receipt_required' => 'integer'];
}
