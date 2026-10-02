<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $regular = [
            '2026-01-01' => "New Year's Day",
            '2026-04-02' => 'Maundy Thursday',
            '2026-04-03' => 'Good Friday',
            '2026-04-09' => 'Araw ng Kagitingan',
            '2026-05-01' => 'Labor Day',
            '2026-06-12' => 'Independence Day',
            '2026-08-31' => 'National Heroes Day',
            '2026-11-30' => 'Bonifacio Day',
            '2026-12-25' => 'Christmas Day',
            '2026-12-30' => 'Rizal Day',
        ];
        $special = [
            '2026-02-17' => 'Chinese New Year',
            '2026-04-04' => 'Black Saturday',
            '2026-08-21' => 'Ninoy Aquino Day',
            '2026-11-01' => "All Saints' Day",
            '2026-11-02' => "All Souls' Day",
            '2026-12-08' => 'Feast of the Immaculate Conception',
            '2026-12-24' => 'Christmas Eve',
            '2026-12-31' => 'Last Day of the Year',
        ];

        $now = now();
        $rows = [];
        foreach ($regular as $date => $name) {
            $rows[] = ['date' => $date, 'name' => $name, 'type' => 'regular', 'multiplier' => 2.00, 'created_at' => $now, 'updated_at' => $now];
        }
        foreach ($special as $date => $name) {
            $rows[] = ['date' => $date, 'name' => $name, 'type' => 'special', 'multiplier' => 1.30, 'created_at' => $now, 'updated_at' => $now];
        }

        DB::table('holidays')->insertOrIgnore($rows);
    }

    public function down(): void
    {
        DB::table('holidays')->where('date', 'like', '2026-%')->delete();
    }
};
