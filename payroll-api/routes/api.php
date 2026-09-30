<?php

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SettingsController;

Route::get('/health', fn () => ['status' => 'ok']);

Route::get('/positions', [PositionController::class, 'index']);
Route::apiResource('employees', EmployeeController::class)->except(['show']);
Route::get('/settings', [SettingsController::class, 'show']);
Route::put('/settings', [SettingsController::class, 'update']);
