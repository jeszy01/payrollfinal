<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    private function format(AuditLog $l): array
    {
        return [
            'id' => $l->id,
            'userName' => $l->user_name,
            'role' => $l->role,
            'action' => $l->action,
            'module' => $l->module,
            'description' => $l->description,
            'details' => $l->details,
            'ip' => $l->ip,
            'createdAt' => $l->created_at->toIso8601String(),
        ];
    }

    public function index(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d',
        ]);

        $tz = config('app.timezone');
        $q = AuditLog::query()->orderByDesc('id');

        if ($request->filled('from')) {
            $q->where('created_at', '>=', Carbon::parse($request->query('from'), 'Asia/Manila')->startOfDay()->setTimezone($tz));
        }
        if ($request->filled('to')) {
            $q->where('created_at', '<=', Carbon::parse($request->query('to'), 'Asia/Manila')->endOfDay()->setTimezone($tz));
        }
        foreach (['module', 'action'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }
        if ($request->filled('q')) {
            $s = '%' . strtolower($request->query('q')) . '%';
            $q->where(fn ($w) => $w->whereRaw('lower(description) like ?', [$s])
                ->orWhereRaw('lower(user_name) like ?', [$s]));
        }

        if ($request->boolean('export')) {
            return $q->limit(5000)->get()->map(fn ($l) => $this->format($l));
        }

        $p = $q->paginate(25);

        return [
            'data' => $p->getCollection()->map(fn ($l) => $this->format($l))->values(),
            'total' => $p->total(),
            'page' => $p->currentPage(),
            'lastPage' => $p->lastPage(),
        ];
    }
}
