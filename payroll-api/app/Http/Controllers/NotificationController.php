<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function mine(Request $request)
    {
        return AppNotification::whereIn('audience', [$request->user()->role, 'all']);
    }

    public function index(Request $request)
    {
        $uid = $request->user()->id;

        return $this->mine($request)->latest()->limit(200)->get()->map(fn ($n) => [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'message' => $n->message,
            'link' => $n->link,
            'read' => in_array($uid, $n->read_by ?? []),
            'createdAt' => $n->created_at->toIso8601String(),
        ]);
    }

    public function read(Request $request, int $id)
    {
        $n = $this->mine($request)->findOrFail($id);
        $by = $n->read_by ?? [];
        if (! in_array($request->user()->id, $by)) {
            $by[] = $request->user()->id;
            $n->update(['read_by' => $by]);
        }

        return response()->noContent();
    }

    public function readAll(Request $request)
    {
        $uid = $request->user()->id;
        $this->mine($request)->get()->each(function ($n) use ($uid) {
            $by = $n->read_by ?? [];
            if (! in_array($uid, $by)) {
                $by[] = $uid;
                $n->update(['read_by' => $by]);
            }
        });

        return response()->noContent();
    }
}
