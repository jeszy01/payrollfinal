<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = ['date', 'name', 'type', 'multiplier'];

    protected $casts = ['date' => 'date', 'multiplier' => 'float'];
}
