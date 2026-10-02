<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request, OtpService $otp)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        // OTP switched off: same behavior as before.
        if (! config('services.otp_enabled') || ! in_array($user->role, ['admin', 'hr'], true)) {
            return $this->issueToken($user, $request);
        }

        $wait = $otp->cooldownLeft($user);
        if ($wait > 0) {
            return response()->json(['message' => "Please wait {$wait}s before requesting a new code."], 429);
        }

        try {
            $otp->send($user);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        return ['otp_required' => true, 'email' => $user->email];
    }

    public function verifyOtp(Request $request, OtpService $otp)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $otp->verify($user, $data['code'])) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        return $this->issueToken($user, $request);
    }

      private function issueToken(User $user, Request $request): array
    {
        $new = $user->createToken('web');

        // Device info is a bonus: never let it break sign-in.
        try {
            $new->accessToken->forceFill([
                'device_name' => $this->deviceName($request),
                'ip_address' => $request->ip(),
            ])->save();
        } catch (\Throwable $e) {
            report($e);
        }

        return [
            'token' => $new->plainTextToken,
            'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ];
    }

    private function deviceName(Request $request): string
    {
        $ua = (string) $request->userAgent();

        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/'), str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Chrome/'), str_contains($ua, 'CriOS') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Browser',
        };

        // Android and iPhone UAs also contain "Linux" / "Mac OS", so check them first.
        $os = match (true) {
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'iPhone'), str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Mac OS') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Unknown OS',
        };

        return "{$browser} on {$os}";
    }

    public function me(Request $request)
    {
        $u = $request->user();

        return ['name' => $u->name, 'email' => $u->email];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
