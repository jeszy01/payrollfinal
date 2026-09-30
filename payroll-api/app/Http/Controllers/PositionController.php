<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PositionController extends Controller
{
    private function format(Position $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'department' => $p->department,
            'salaryGrade' => $p->grade_code,
            'monthlySalary' => $p->monthly_salary,
        ];
    }

    public function index()
    {
        return Position::orderBy('department')->orderBy('name')->get()->map(fn ($p) => $this->format($p));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('positions', 'name')->where('department', $request->input('department')),
            ],
            'department' => 'required|string|max:255',
            'salaryGrade' => 'required|string|max:50',
            'monthlySalary' => 'required|numeric|min:0',
        ], ['name.unique' => 'This position already exists in that department.']);

        $position = Position::create([
            'name' => $data['name'],
            'department' => $data['department'],
            'grade_code' => $data['salaryGrade'],
            'monthly_salary' => $data['monthlySalary'],
        ]);

        return response()->json($this->format($position), 201);
    }

    public function update(Request $request, Position $position)
    {
        $department = $request->input('department', $position->department);

        $data = $request->validate([
            'name' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('positions', 'name')->where('department', $department)->ignore($position->id),
            ],
            'department' => 'sometimes|string|max:255',
            'salaryGrade' => 'sometimes|string|max:50',
            'monthlySalary' => 'sometimes|numeric|min:0',
        ], ['name.unique' => 'This position already exists in that department.']);

        $map = [
            'name' => 'name',
            'department' => 'department',
            'salaryGrade' => 'grade_code',
            'monthlySalary' => 'monthly_salary',
        ];

        foreach ($map as $input => $column) {
            if (array_key_exists($input, $data)) {
                $position->{$column} = $data[$input];
            }
        }

        $position->save();

        return $this->format($position);
    }

    public function destroy(Position $position)
    {
        if ($position->employees()->exists()) {
            return response()->json(['message' => 'This position is assigned to employees.'], 422);
        }

        $position->delete();

        return response()->noContent();
    }
}
