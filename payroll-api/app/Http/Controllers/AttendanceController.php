<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\PayrollSetting;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    private function format(AttendanceRecord $r): array
    {
        return [
            'id' => $r->id,
            'employeeId' => $r->employee_id,
            'employeeName' => $r->employee_name,
            'date' => $r->date->format('Y-m-d'),
            'dailyRate' => $r->daily_rate,
            'rules' => $r->rules,
            'timeIn' => $r->time_in,
            'timeOut' => $r->time_out,
            'absent' => $r->absent,
            'archived' => $r->archived,
        ];
    }

    public function index(Request $request)
    {
        $query = AttendanceRecord::query()->orderBy('date')->orderBy('employee_name');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->query('date'));
        }

        return $query->get()->map(fn ($r) => $this->format($r));
    }

    /** Insert or update the record (one per employee per day). */
    public function upsert(Request $request)
    {
        $data = $request->validate([
            'employeeId' => 'required|uuid|exists:employees,id',
            'date' => 'required|date_format:Y-m-d',
            'timeIn' => 'nullable|date_format:H:i',
            'timeOut' => 'nullable|date_format:H:i',
            'absent' => 'sometimes|boolean',
            'archived' => 'sometimes|boolean',
        ]);

        $employee = Employee::with('position')->findOrFail($data['employeeId']);

        $record = AttendanceRecord::firstOrNew([
            'employee_id' => $employee->id,
            'date' => $data['date'],
        ]);

        $wasNew = ! $record->exists;

        // Snapshot: saved only for a new record, so past days never change.
        if ($wasNew) {
            $record->employee_name = $employee->name;
            $record->daily_rate = $employee->daily_rate;
            $record->rules = PayrollSetting::current()->toRules();
        }

        $map = [
            'timeIn' => 'time_in',
            'timeOut' => 'time_out',
            'absent' => 'absent',
            'archived' => 'archived',
        ];

        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $record->{$column} = $data[$input];
            }
        }

        $record->save();

        return response()->json($this->format($record), $wasNew ? 201 : 200);
    }
}
