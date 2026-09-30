<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AttendanceEventController extends Controller
{
    //
    public function store(\Illuminate\Http\Request $request)
{
    $data = $request->validate([
        'employee_no' => 'required|string|exists:employees,employee_no',
        'type' => 'required|in:time_in,time_out,absent',
        'occurred_at' => 'required|date',
    ]);

    $employee = \App\Models\Employee::with('position')->where('employee_no', $data['employee_no'])->firstOrFail();
    $at = \Illuminate\Support\Carbon::parse($data['occurred_at'])->setTimezone(config('app.timezone'));
    $date = $at->toDateString();
    $time = $at->format('H:i');

    $record = \App\Models\AttendanceRecord::where('employee_id', $employee->id)->where('date', $date)->first();

    if ($data['type'] === 'time_out') {
        if (!$record || !$record->time_in) {
            return response()->json(['message' => 'Walang time in sa araw na ito.'], 422);
        }
        $record->update(['time_out' => $time]);
        return response()->json($record);
    }

    if ($record) {
        return response()->json(['message' => 'May record na sa araw na ito.'], 409);
    }

    $record = \App\Models\AttendanceRecord::create([
        'employee_id' => $employee->id,
        'employee_name' => $employee->name,
        'date' => $date,
        'time_in' => $data['type'] === 'time_in' ? $time : null,
        'absent' => $data['type'] === 'absent',
        'daily_rate' => $employee->daily_rate,
        'rules' => \App\Models\PayrollSetting::current()->toRules(),
    ]);

    return response()->json($record, 201);
}
}
