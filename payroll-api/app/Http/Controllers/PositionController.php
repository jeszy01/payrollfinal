<?php

namespace App\Http\Controllers;

use App\Models\Position;

class PositionController extends Controller
{
    public function index()
    {
        return Position::with('salaryGrade')
            ->orderBy('department')
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'department' => $p->department,
                'salaryGrade' => $p->salaryGrade->code,
                'monthlySalary' => $p->salaryGrade->monthly_salary,
            ]);
    }
}
