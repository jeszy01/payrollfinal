<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private function format(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'createdAt' => $u->created_at?->toDateString(),
        ];
    }

    public function index()
    {
        return User::orderBy('created_at')->get()->map(fn ($u) => $this->format($u));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(['admin', 'hr'])],
            'password' => 'required|string|min:8|max:100',
        ]);

        return response()->json($this->format(User::create($data)), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'hr'])],
            'password' => 'nullable|string|min:8|max:100',
        ]);

        if (isset($data['role']) && $data['role'] !== $user->role && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot change your own role.'], 422);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return $this->format($user->fresh());
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }
}
