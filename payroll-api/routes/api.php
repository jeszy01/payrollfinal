<?php

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AdjustmentController;

Route::get('/health', fn () => ['status' => 'ok']);

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
