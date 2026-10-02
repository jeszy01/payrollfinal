<?php

namespace App\Services;

use App\Models\AppNotification;

class Notifier
{
    public static function send(string $type, string $title, ?string $message = null, string $audience = 'all', ?string $link = null): void
    {
        AppNotification::create(compact('type', 'title', 'message', 'audience', 'link') + ['read_by' => []]);
    }
}
