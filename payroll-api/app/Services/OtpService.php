<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class OtpService
{
    public const TTL_MINUTES = 5;
    public const MAX_ATTEMPTS = 5;
    public const COOLDOWN_SECONDS = 60;

    public function cooldownLeft(User $user): int
    {
        if (! $user->otp_sent_at) {
            return 0;
        }
        return max(0, self::COOLDOWN_SECONDS - (int) $user->otp_sent_at->diffInSeconds(now(), true));
    }

    public function send(User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'otp_code' => Hash::make($code),
            'otp_expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'otp_sent_at' => now(),
            'otp_attempts' => 0,
        ])->save();

$key = config('services.resend.keys')[$user->email] ?? config('services.resend.key');

$res = Http::withToken((string) $key)
            ->post('https://api.resend.com/emails', [
                'from' => 'Archon Nell <' . config('services.resend.from') . '>',
                'to' => [$user->email],
                'subject' => 'Your verification code',
                'html' => "<p>Your code is <strong style=\"font-size:22px;letter-spacing:4px\">{$code}</strong></p>"
                    . '<p>It expires in ' . self::TTL_MINUTES . ' minutes.</p>',
            ]);

        if ($res->failed()) {
            $this->clear($user);
            throw new \RuntimeException('Could not send the verification code.');
        }
    }

    public function verify(User $user, string $code): bool
    {
        if (! $user->otp_code || ! $user->otp_expires_at || $user->otp_expires_at->isPast()) {
            return false;
        }

        if ($user->otp_attempts >= self::MAX_ATTEMPTS) {
            $this->clear($user);
            return false;
        }

        $user->forceFill(['otp_attempts' => $user->otp_attempts + 1])->save();

        if (! Hash::check($code, $user->otp_code)) {
            return false;
        }

        $this->clear($user);
        return true;
    }

    private function clear(User $user): void
    {
        $user->forceFill([
            'otp_code' => null,
            'otp_expires_at' => null,
            'otp_attempts' => 0,
        ])->save();
    }
}
