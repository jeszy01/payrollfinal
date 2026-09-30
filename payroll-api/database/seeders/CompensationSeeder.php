<?php

namespace Database\Seeders;

use App\Models\Position;
use App\Models\SalaryGrade;
use Illuminate\Database\Seeder;

class CompensationSeeder extends Seeder
{
    public function run(): void
    {
        $grades = [
            ['code' => 'SG-1', 'name' => 'Entry',   'monthly_salary' => 18000],
            ['code' => 'SG-2', 'name' => 'Staff',   'monthly_salary' => 25000],
            ['code' => 'SG-3', 'name' => 'Senior',  'monthly_salary' => 35000],
            ['code' => 'SG-4', 'name' => 'Manager', 'monthly_salary' => 50000],
        ];

        foreach ($grades as $g) {
            SalaryGrade::firstOrCreate(['code' => $g['code']], $g);
        }

        $positions = [
            ['name' => 'Assistant', 'department' => 'HR',      'grade' => 'SG-2'],
            ['name' => 'Manager',   'department' => 'HR',      'grade' => 'SG-4'],
            ['name' => 'Manager',   'department' => 'Finance', 'grade' => 'SG-4'],
        ];

        foreach ($positions as $p) {
            Position::firstOrCreate(
                ['name' => $p['name'], 'department' => $p['department']],
                ['salary_grade_id' => SalaryGrade::where('code', $p['grade'])->value('id')]
            );
        }
    }
}
