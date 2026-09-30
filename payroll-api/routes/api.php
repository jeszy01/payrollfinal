<?php

use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

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
});
