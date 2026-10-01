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

    Route::get('/health', fn () => ['status' => 'ok']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::post('/attendance-events', [AttendanceEventController::class, 'store'])
    ->middleware([ApiKey::class, 'throttle:120,1']);
    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('positions', PositionController::class)->except(['show']);
    Route::apiResource('employees', EmployeeController::class)->except(['show']);
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);

    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::put('/attendance', [AttendanceController::class, 'upsert']);

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

    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
    Route::middleware(EnsureRole::class . ':admin')->group(function () {
    Route::apiResource('users', UserController::class)->except(['show']);
});
});
