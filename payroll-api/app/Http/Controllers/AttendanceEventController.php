<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollSetting;
use App\Services\DayCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceEventController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_no' => 'required|string|exists:employees,employee_no',
            'type' => 'required|in:time_in,time_out,absent',
            'occurred_at' => 'required|date',
            'ot_reason' => 'nullable|string|max:500', // sent with time_out; required only if OT
        ]);

        $employee = Employee::with('position')->where('employee_no', $data['employee_no'])->firstOrFail();
        $at = Carbon::parse($data['occurred_at'])->setTimezone(config('app.timezone'));
        $date = $at->toDateString();
        $time = $at->format('H:i');

        $record = AttendanceRecord::where('employee_id', $employee->id)->where('date', $date)->first();

        if ($data['type'] === 'time_out') {
            if (! $record || ! $record->time_in) {
                return response()->json(['message' => 'Walang time in sa araw na ito.'], 422);
            }

            $record->time_out = $time;

            if (! DayCalculator::applyOvertime($record, $data['ot_reason'] ?? null)) {
                return response()->json([
                    'message' => 'OT reason is required.',
                    'requiresOtReason' => true,
                    'otMinutes' => DayCalculator::overtimeMinutes($record),
                ], 422); // time_out is NOT saved until a reason is sent
            }

            $record->save();

            return response()->json($record);
        }

        if ($record) {
            return response()->json(['message' => 'May record na sa araw na ito.'], 409);
        }

        $record = AttendanceRecord::create([
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'date' => $date,
            'time_in' => $data['type'] === 'time_in' ? $time : null,
            'absent' => $data['type'] === 'absent',
            'daily_rate' => $employee->daily_rate,
            'rules' => PayrollSetting::current()->toRules(),
        ]);

        return response()->json($record, 201);
    }
}
