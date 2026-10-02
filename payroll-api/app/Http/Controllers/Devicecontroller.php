<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DeviceController extends Controller
{
    /** GET /devices - the logged-in user's own devices. */
    public function index(Request $request)
    {
        $currentId = (string) $request->user()->currentAccessToken()->id;

        return $request->user()->tokens()
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'device' => $t->device_name ?: 'Unknown device',
                'ip' => $t->ip_address,
                'lastUsedAt' => $t->last_used_at?->toIso8601String(),
                'createdAt' => $t->created_at?->toIso8601String(),
                'current' => (string) $t->id === $currentId,
            ]);
    }

    /** DELETE /devices/{id} - remove one device (it is logged out on its next request). */
    public function destroy(Request $request, string $id)
    {
        $token = $request->user()->tokens()->findOrFail($id);

        if ((string) $token->id === (string) $request->user()->currentAccessToken()->id) {
            return response()->json(['message' => 'This is your current device. Use Log out instead.'], 422);
        }

        $token->delete();

        return response()->noContent();
    }

    /** DELETE /devices/others - log out every device except this one. */
    public function destroyOthers(Request $request)
    {
        $removed = $request->user()->tokens()
            ->where('id', '!=', $request->user()->currentAccessToken()->id)
            ->delete();

        return ['removed' => $removed];
    }
}
