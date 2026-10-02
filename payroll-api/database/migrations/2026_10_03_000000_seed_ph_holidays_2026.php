<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $list = [
            ['2026-01-01', "New Year's Day", 'regular'],
            ['2026-02-17', 'Chinese New Year', 'special'],
            ['2026-03-20', "Eid'l Fitr", 'regular'],
            ['2026-04-02', 'Maundy Thursday', 'regular'],
            ['2026-04-03', 'Good Friday', 'regular'],
            ['2026-04-04', 'Black Saturday', 'special'],
            ['2026-04-09', 'Araw ng Kagitingan', 'regular'],
            ['2026-05-01', 'Labor Day', 'regular'],
            ['2026-06-12', 'Independence Day', 'regular'],
            ['2026-08-21', 'Ninoy Aquino Day', 'special'],
            ['2026-08-31', 'National Heroes Day', 'regular'],
            ['2026-11-01', "All Saints' Day", 'special'],
            ['2026-11-02', "All Souls' Day", 'special'],
            ['2026-11-30', 'Bonifacio Day', 'regular'],
            ['2026-12-08', 'Feast of the Immaculate Conception', 'special'],
            ['2026-12-24', 'Christmas Eve', 'special'],
            ['2026-12-25', 'Christmas Day', 'regular'],
            ['2026-12-30', 'Rizal Day', 'regular'],
            ['2026-12-31', 'Last Day of the Year', 'special'],
        ];

        $stamps = Schema::hasColumn('holidays', 'created_at')
            ? ['created_at' => now(), 'updated_at' => now()]
            : [];

        foreach ($list as [$date, $name, $type]) {
            // Skip dates that already exist, so your own entries are kept.
            if (DB::table('holidays')->whereDate('date', $date)->exists()) {
                continue;
            }
            DB::table('holidays')->insert([
                'date' => $date,
                'name' => $name,
                'type' => $type,
                'multiplier' => $type === 'regular' ? 2 : 1.3,
            ] + $stamps);
        }
    }

    public function down(): void
    {
        // Intentionally empty: do not delete holidays on rollback.
    }
};
