<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
 public function handle(\Illuminate\Http\Request $request, \Closure $next)
{
    $key = config('services.attendance.key');
    if (!$key || !hash_equals($key, (string) $request->header('X-API-Key'))) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }
    return $next($request);
}
}
