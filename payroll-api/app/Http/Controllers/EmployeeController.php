<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private function format(Employee $e): array
    {
      $e->loadMissing('position');
        return [
            'id' => $e->id,
            'employeeNo' => $e->employee_no,
            'name' => $e->name,
            'email' => $e->email,
            'phone' => $e->phone,
            'positionId' => $e->position_id,
            'position' => $e->position->name,
            'department' => $e->position->department,
         'salaryGrade' => $e->position->grade_code,
            'baseSalary' => $e->base_salary,
            'dailyRate' => $e->daily_rate,
            'status' => $e->status,
            'employmentType' => $e->employment_type,
            'civilStatus' => $e->civil_status,
            'dateHired' => $e->date_hired->format('Y-m-d'),
        ];
    }

    private function nextEmployeeNo(): string
    {
        $max = Employee::pluck('employee_no')
            ->map(fn ($no) => (int) substr($no, 4))
            ->max() ?? 0;

        return 'EMP-' . str_pad($max + 1, 3, '0', STR_PAD_LEFT);
    }

    public function index()
    {
     return Employee::with('position')
            ->orderBy('employee_no')
            ->get()
            ->map(fn ($e) => $this->format($e));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:employees,email',
            'phone' => 'nullable|string|max:50',
            'positionId' => 'required|uuid|exists:positions,id',
            'status' => 'sometimes|string|max:50',
            'employmentType' => 'sometimes|string|max:50',
            'civilStatus' => 'nullable|string|max:50',
            'dateHired' => 'required|date',
        ]);

        $employee = Employee::create([
            'employee_no' => $this->nextEmployeeNo(),
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'position_id' => $data['positionId'],
            'status' => $data['status'] ?? 'Active',
            'employment_type' => $data['employmentType'] ?? 'Regular',
            'civil_status' => $data['civilStatus'] ?? null,
            'date_hired' => $data['dateHired'],
        ]);

        return response()->json($this->format($employee), 201);
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('employees', 'email')->ignore($employee->id)],
            'phone' => 'nullable|string|max:50',
            'positionId' => 'sometimes|uuid|exists:positions,id',
            'status' => 'sometimes|string|max:50',
            'employmentType' => 'sometimes|string|max:50',
            'civilStatus' => 'nullable|string|max:50',
            'dateHired' => 'sometimes|date',
        ]);

        $map = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'positionId' => 'position_id',
            'status' => 'status',
            'employmentType' => 'employment_type',
            'civilStatus' => 'civil_status',
            'dateHired' => 'date_hired',
        ];

        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $employee->{$column} = $data[$input];
            }
        }

        $employee->save();
        $employee->unsetRelation('position');

        return $this->format($employee);
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return response()->noContent();
    }
}
