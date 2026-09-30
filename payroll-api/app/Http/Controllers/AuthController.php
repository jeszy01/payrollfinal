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
    if (! config('services.otp_enabled')) {
        return $this->issueToken($user);
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

    return $this->issueToken($user);
}

private function issueToken(User $user): array
{
    return [
        'token' => $user->createToken('web')->plainTextToken,
        'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role],
    ];
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
