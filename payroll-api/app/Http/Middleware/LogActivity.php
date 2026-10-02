<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class LogActivity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $response = $next($request);

        try {
        $this->record($request, $response->getStatusCode(), $user, $response);
        } catch (\Throwable $e) {
            report($e);
        }

        return $response;
    }

private function record(Request $request, int $status, $user, $response = null): void
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return;
        }

        $uri = preg_replace('#^api/#', '', $request->route()?->uri() ?? $request->path());

      if ($uri === 'login') {
    $email = (string) $request->input('email');
    $account = User::where('email', $email)->first();
    $otpRequired = (json_decode($response?->getContent() ?? '', true)['otp_required'] ?? false);

    if ($status >= 400) {
        $this->write($request, $account, 'Failed login', 'Auth', 'Failed sign-in attempt', ['email' => $email], $email);
    } elseif ($otpRequired) {
        $this->write($request, $account, 'OTP sent', 'Auth', 'Password accepted, OTP sent', ['email' => $email], $email);
    } else {
        $this->write($request, $account, 'Login', 'Auth', 'Signed in', ['email' => $email], $email);
    }
    return;
}

if ($uri === 'verify-otp') {
    $email = (string) $request->input('email');
    $account = User::where('email', $email)->first();
    $ok = $status < 400;
    $this->write($request, $account, $ok ? 'Login' : 'Failed OTP', 'Auth',
        $ok ? 'Signed in (OTP verified)' : 'Invalid or expired OTP', ['email' => $email], $email);
    return;
}

if ($status >= 400) {
    return;
}

        if ($uri === 'logout') {
            $this->write($request, $user, 'Logout', 'Auth', 'Signed out');
            return;
        }

        [$module, $action, $description] = $this->describe($request->method(), $uri);

        $ids = collect($request->route()?->parameters() ?? [])
            ->map(fn ($v) => $v instanceof Model ? $v->getKey() : $v)->all();
        $name = $request->input('name');
        if (is_string($name) && $name !== '') {
            $description .= " — {$name}";
        }

        $this->write($request, $user, $action, $module, $description, array_merge(['record' => $ids], $this->clean($request)));
    }

    private function describe(string $method, string $uri): array
    {
         if ($uri === 'devices/others') {
            return ['Auth', 'Removed', 'Logged out all other devices'];
        }
        if (str_starts_with($uri, 'devices/')) {
            return ['Auth', 'Removed', 'Removed a logged-in device'];
        }
        $map = [
            '#^employees#' => ['Employees', 'employee'],
            '#^positions#' => ['Employees', 'position'],
            '#^users#' => ['Users', 'user'],
            '#^settings#' => ['Payroll', 'payroll settings'],
            '#^attendance#' => ['Attendance', 'attendance'],
            '#^adjustments#' => ['Compensation', 'adjustment request'],
            '#^payroll-runs#' => ['Payroll', 'payroll run'],
            '#^contribution-rates#' => ['Benefits', 'contribution rates'],
            '#^benefits/claim-types#' => ['Claims', 'claim type'],
            '#^benefits/hmo-plans#' => ['Benefits', 'HMO plan'],
            '#^benefits/company-benefits#' => ['Benefits', 'company benefit'],
            '#^benefits/enrollments#' => ['Benefits', 'enrollment'],
            '#^benefits/loans#' => ['Benefits', 'loan'],
            '#^claims#' => ['Claims', 'claim'],
            '#^ai/chat#' => ['AI', 'Arc question'],
        ];

        $module = 'System';
        $subject = $uri;
        foreach ($map as $pattern => [$m, $s]) {
            if (preg_match($pattern, $uri)) {
                $module = $m;
                $subject = $s;
                break;
            }
        }

        $action = match (true) {
            str_ends_with($uri, '/approve') => 'Approved',
            str_ends_with($uri, '/reject') => 'Rejected',
            str_ends_with($uri, '/release') => 'Released',
            str_ends_with($uri, '/paid') => 'Marked as paid',
            $method === 'DELETE' => 'Deleted',
            $method === 'POST' && $uri === 'payroll-runs' => 'Generated',
            $uri === 'attendance' => 'Recorded',
            $uri === 'ai/chat' => 'Asked',
            $method === 'POST' => 'Created',
            default => 'Updated',
        };

        $description = $action === 'Marked as paid' ? "Marked {$subject} as paid" : "{$action} {$subject}";

        return [$module, $action, $description];
    }

    private function clean(Request $request): array
    {
        $input = Arr::except($request->all(), [
            'password', 'password_confirmation', 'current_password', 'otp', 'code', 'token',
            'attachmentData', 'attachment_data',
        ]);

        return array_map(
            fn ($v) => is_string($v) && strlen($v) > 200 ? substr($v, 0, 200) . '…' : $v,
            $input
        );
    }

    private function write(Request $request, $user, string $action, string $module, string $description, ?array $details = null, ?string $fallbackName = null): void
    {
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? $fallbackName,
            'role' => $user?->role,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'details' => $details,
            'method' => $request->method(),
            'path' => $request->path(),
            'ip' => trim(explode(',', (string) $request->header('X-Forwarded-For', $request->ip()))[0]),
            'created_at' => now(),
        ]);
    }
}
