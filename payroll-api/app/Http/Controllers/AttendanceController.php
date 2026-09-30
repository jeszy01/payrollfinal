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

    /** Insert o i-update ang record (isa kada employee kada araw). */
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

        $employee = Employee::with('position.salaryGrade')->findOrFail($data['employeeId']);

        $record = AttendanceRecord::firstOrNew([
            'employee_id' => $employee->id,
            'date' => $data['date'],
        ]);

        // Snapshot: sine-save lang kapag bagong record, kaya hindi na nababago pagkatapos.
        if (! $record->exists) {
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

        $wasNew = ! $record->exists;
        $record->save();

        return response()->json($this->format($record), $wasNew ? 201 : 200);
    }
}
