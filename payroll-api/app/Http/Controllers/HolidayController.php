<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    private function format(Holiday $h): array
    {
        return [
            'id' => $h->id,
            'date' => $h->date->format('Y-m-d'),
            'name' => $h->name,
            'type' => $h->type,
            'multiplier' => $h->multiplier,
        ];
    }

    private function rules(?int $id = null): array
    {
        return [
            'date' => 'required|date_format:Y-m-d|unique:holidays,date' . ($id ? ",{$id}" : ''),
            'name' => 'required|string|max:100',
            'type' => 'required|in:regular,special',
            'multiplier' => 'required|numeric|min:1|max:5',
        ];
    }

    public function index()
    {
        return Holiday::orderBy('date')->get()->map(fn ($h) => $this->format($h));
    }

    public function store(Request $request)
    {
        $h = Holiday::create($request->validate($this->rules()));

        return response()->json($this->format($h), 201);
    }

    public function update(Request $request, Holiday $holiday)
    {
        $holiday->update($request->validate($this->rules($holiday->id)));

        return $this->format($holiday);
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return response()->noContent();
    }
}
