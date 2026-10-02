<?php

use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceEventController;
use App\Http\Middleware\ApiKey;
use App\Http\Controllers\PayrollRunController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\LogActivity;
use App\Http\Controllers\OvertimeController;

    Route::get('/health', fn () => ['status' => 'ok']);
    Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:10,1', LogActivity::class]);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware(['throttle:10,1', LogActivity::class]);

    Route::post('/attendance-events', [AttendanceEventController::class, 'store'])
    ->middleware([ApiKey::class, 'throttle:120,1']);
    Route::middleware(['auth:sanctum', LogActivity::class])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'readAll']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'read']);

    Route::post('/ai/chat', [\App\Http\Controllers\AiController::class, 'chat'])
    ->middleware([EnsureRole::class . ':admin,hr', 'throttle:20,1']);

    Route::apiResource('positions', PositionController::class)->except(['show']);
    Route::apiResource('employees', EmployeeController::class)->except(['show']);
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::get('/contribution-rates', [\App\Http\Controllers\ContributionRateController::class, 'index']);
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);
    Route::get('/benefits/{resource}', [\App\Http\Controllers\BenefitController::class, 'index']);
    Route::post('/benefits/{resource}', [\App\Http\Controllers\BenefitController::class, 'store']);
    Route::put('/benefits/{resource}/{id}', [\App\Http\Controllers\BenefitController::class, 'update']);
    Route::delete('/benefits/{resource}/{id}', [\App\Http\Controllers\BenefitController::class, 'destroy']);

    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::put('/attendance', [AttendanceController::class, 'upsert']);
    Route::get('/attendance/overtime', [OvertimeController::class, 'index']);
    Route::post('/attendance/overtime/{id}/approve', [OvertimeController::class, 'approve']);
    Route::post('/attendance/overtime/{id}/reject', [OvertimeController::class, 'reject']);

    Route::get('/adjustments', [AdjustmentController::class, 'index']);
    Route::post('/adjustments', [AdjustmentController::class, 'store']);
    Route::post('/adjustments/{adjustment}/approve', [AdjustmentController::class, 'approve']);
    Route::post('/adjustments/{adjustment}/reject', [AdjustmentController::class, 'reject']);

    Route::get('/payroll-runs', [PayrollRunController::class, 'index']);
    Route::get('/payroll-runs/{payrollRun}', [PayrollRunController::class, 'show']);
    Route::post('/payroll-runs', [PayrollRunController::class, 'store']);
    Route::post('/payroll-runs/{payrollRun}/release', [PayrollRunController::class, 'release']);

    Route::middleware(EnsureRole::class . ':admin')->group(function () {
    Route::post('/payroll-runs/{payrollRun}/approve', [PayrollRunController::class, 'approve']);
    Route::delete('/payroll-runs/{payrollRun}', [PayrollRunController::class, 'destroy']);
});

    Route::get('/contribution-rates', [\App\Http\Controllers\ContributionRateController::class, 'index']);
    Route::get('/claims', [\App\Http\Controllers\ClaimController::class, 'index']);
    Route::post('/claims', [\App\Http\Controllers\ClaimController::class, 'store']);
    Route::get('/claims/{claim}/attachment', [\App\Http\Controllers\ClaimController::class, 'attachment']);
    Route::post('/claims/{claim}/paid', [\App\Http\Controllers\ClaimController::class, 'markPaid']);
    Route::delete('/claims/{claim}', [\App\Http\Controllers\ClaimController::class, 'destroy']);
    Route::put('/contribution-rates/{type}', [\App\Http\Controllers\ContributionRateController::class, 'update']);
    Route::post('/claims/{claim}/approve', [\App\Http\Controllers\ClaimController::class, 'approve']);
    Route::post('/claims/{claim}/reject', [\App\Http\Controllers\ClaimController::class, 'reject']);



    Route::middleware(EnsureRole::class . ':admin')->group(function () {
    Route::apiResource('users', UserController::class)->except(['show']);
    Route::get('/audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index']);
});
});
