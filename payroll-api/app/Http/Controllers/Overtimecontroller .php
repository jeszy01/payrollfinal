<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class OvertimeController extends Controller
{
    private function format(AttendanceRecord $r): array
    {
        return [
            'id' => $r->id,
            'employeeId' => $r->employee_id,
            'employeeName' => $r->employee_name,
            'date' => $r->date->format('Y-m-d'),
            'timeIn' => $r->time_in,
            'timeOut' => $r->time_out,
            'otMinutes' => $r->ot_minutes,
            'otReason' => $r->ot_reason,
            'otStatus' => $r->ot_status,
            'otRemarks' => $r->ot_remarks,
            'otReviewedBy' => $r->ot_reviewed_by,
            'otReviewedAt' => $r->ot_reviewed_at?->toIso8601String(),
        ];
    }

    /** GET /attendance/overtime?status=pending|approved|rejected|all&from=&to= */
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');

        $q = AttendanceRecord::query()
            ->whereNotNull('ot_status')
            ->orderBy('date')
            ->orderBy('employee_name');

        if ($status !== 'all') {
            $q->where('ot_status', $status);
        }
        if ($request->filled('from')) {
            $q->whereDate('date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $q->whereDate('date', '<=', $request->query('to'));
        }

        return $q->get()->map(fn ($r) => $this->format($r));
    }

    public function approve(Request $request, string $id)
    {
        return $this->review($request, $id, 'approved', $request->validate([
            'remarks' => 'nullable|string|max:500',
        ]));
    }

    public function reject(Request $request, string $id)
    {
        return $this->review($request, $id, 'rejected', $request->validate([
            'remarks' => 'required|string|max:500',
        ]));
    }

    private function review(Request $request, string $id, string $status, array $data)
    {
        $r = AttendanceRecord::findOrFail($id);

        if ($r->ot_status !== 'pending') {
            return response()->json(['message' => 'Only pending OT can be reviewed.'], 409);
        }

        $r->ot_status = $status;
        $r->ot_remarks = $data['remarks'] ?? null;
        $r->ot_reviewed_by = $request->user()?->name;
        $r->ot_reviewed_at = now();
        $r->save();

        return $this->format($r);
    }
}
