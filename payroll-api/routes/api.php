<?php

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AttendanceController;

Route::get('/health', fn () => ['status' => 'ok']);

Route::get('/positions', [PositionController::class, 'index']);
Route::apiResource('employees', EmployeeController::class)->except(['show']);
Route::get('/settings', [SettingsController::class, 'show']);
Route::put('/settings', [SettingsController::class, 'update']);

Route::get('/attendance', [AttendanceController::class, 'index']);
Route::put('/attendance', [AttendanceController::class, 'upsert']);
