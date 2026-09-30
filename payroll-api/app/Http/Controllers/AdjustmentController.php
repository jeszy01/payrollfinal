<?php

namespace App\Http\Controllers;

use App\Models\AdjustmentRequest;
use App\Models\Employee;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdjustmentController extends Controller
{
    private function format(AdjustmentRequest $a): array
    {
        return [
            'id' => $a->id,
            'type' => $a->type,
            'employeeId' => $a->employee_id,
            'positionId' => $a->position_id,
            'newPositionId' => $a->new_position_id,
            'oldSalary' => $a->old_salary,
            'newSalary' => $a->new_salary,
            'reason' => $a->reason,
            'status' => $a->status,
            'decidedAt' => $a->decided_at?->toDateString(),
            'createdAt' => $a->created_at?->toDateString(),
        ];
    }

    public function index()
    {
        return AdjustmentRequest::orderByDesc('created_at')->get()->map(fn ($a) => $this->format($a));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:promotion,market',
            'employeeId' => 'required_if:type,promotion|nullable|exists:employees,id',
            'newPositionId' => 'required_if:type,promotion|nullable|exists:positions,id',
            'positionId' => 'required_if:type,market|nullable|exists:positions,id',
            'newSalary' => 'required_if:type,market|nullable|numeric|min:0',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($data['type'] === 'promotion') {
            $employee = Employee::findOrFail($data['employeeId']);
            $current = Position::findOrFail($employee->position_id);
            $target = Position::findOrFail($data['newPositionId']);

            if ($current->id === $target->id) {
                return response()->json(['message' => 'Employee is already in that position.'], 422);
            }

            $attrs = [
                'type' => 'promotion',
                'employee_id' => $employee->id,
                'new_position_id' => $target->id,
                'old_salary' => $current->monthly_salary,
                'new_salary' => $target->monthly_salary,
            ];
        } else {
            $position = Position::findOrFail($data['positionId']);
            $attrs = [
                'type' => 'market',
                'position_id' => $position->id,
                'old_salary' => $position->monthly_salary,
                'new_salary' => $data['newSalary'],
            ];
        }

        $adjustment = AdjustmentRequest::create($attrs + ['reason' => $data['reason'] ?? null]);

        return response()->json($this->format($adjustment), 201);
    }

    public function approve(AdjustmentRequest $adjustment)
    {
        if ($adjustment->status !== 'pending') {
            return response()->json(['message' => 'This request was already decided.'], 422);
        }

        DB::transaction(function () use ($adjustment) {
            if ($adjustment->type === 'promotion') {
                $employee = Employee::findOrFail($adjustment->employee_id);
                $employee->position_id = $adjustment->new_position_id;
                $employee->save();
            } else {
                $position = Position::findOrFail($adjustment->position_id);
                $position->monthly_salary = $adjustment->new_salary;
                $position->save();
            }

            $adjustment->update(['status' => 'approved', 'decided_at' => now()]);
        });

        return $this->format($adjustment->fresh());
    }

    public function reject(AdjustmentRequest $adjustment)
    {
        if ($adjustment->status !== 'pending') {
            return response()->json(['message' => 'This request was already decided.'], 422);
        }

        $adjustment->update(['status' => 'rejected', 'decided_at' => now()]);

        return $this->format($adjustment->fresh());
    }
}
