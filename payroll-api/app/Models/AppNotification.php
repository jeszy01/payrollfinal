<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $table = 'app_notifications';
    protected $fillable = ['type', 'title', 'message', 'audience', 'link', 'read_by'];
    protected $casts = ['read_by' => 'array'];
}
