<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\ClaimType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use App\Models\Employee;
use App\Services\Notifier;

class ClaimController extends Controller
{
    private function format(Claim $c): array
    {
        return [
            'id' => $c->id,
            'employeeId' => $c->employee_id,
            'claimTypeId' => $c->claim_type_id,
            'expenseDate' => $c->expense_date->format('Y-m-d'),
            'amount' => $c->amount,
            'description' => $c->description,
            'status' => $c->status,
            'rejectReason' => $c->reject_reason,
            'payrollRunId' => $c->payroll_run_id,
            'paidMethod' => $c->paid_method,
            'paidAt' => $c->paid_at?->format('Y-m-d'),
            'paymentRef' => $c->payment_ref,
            'hasAttachment' => (bool) $c->attachment_name,
            'attachmentName' => $c->attachment_name,
        ];
    }

    private function fail(string $message)
    {
        return response()->json(['message' => $message], 422);
    }

    public function index()
    {
        $cols = array_values(array_diff(Schema::getColumnListing('claims'), ['attachment_data']));
        return Claim::select($cols)->latest()->get()->map(fn ($c) => $this->format($c));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employeeId' => 'required|exists:employees,id',
            'claimTypeId' => 'required|exists:claim_types,id',
            'expenseDate' => 'required|date_format:Y-m-d',
            'amount' => 'required|numeric|gt:0',
            'description' => 'nullable|string|max:500',
            'attachmentName' => 'nullable|string|max:150',
            'attachmentMime' => 'nullable|in:image/jpeg,image/png,image/webp,application/pdf',
            'attachmentData' => 'nullable|string|max:3000000',
        ]);

        $type = ClaimType::findOrFail($data['claimTypeId']);
        $today = now('Asia/Manila')->startOfDay();
        $date = Carbon::parse($data['expenseDate'], 'Asia/Manila')->startOfDay();

        if ($date->gt($today)) {
            return $this->fail('The expense date cannot be in the future.');
        }
        if ($type->deadline_days !== null && $date->lt($today->copy()->subDays($type->deadline_days))) {
            return $this->fail("{$type->name} claims must be submitted within {$type->deadline_days} days of the expense.");
        }
        if ($type->max_amount !== null && $data['amount'] > $type->max_amount) {
            return $this->fail("The maximum for {$type->name} is " . number_format($type->max_amount, 2) . '.');
        }
        if ($type->receipt_required && empty($data['attachmentData'])) {
            return $this->fail('A receipt or attachment is required for this claim type.');
        }

        $claim = Claim::create([
            'employee_id' => $data['employeeId'],
            'claim_type_id' => $data['claimTypeId'],
            'expense_date' => $data['expenseDate'],
            'amount' => $data['amount'],
            'description' => $data['description'] ?? null,
            'attachment_name' => $data['attachmentName'] ?? null,
            'attachment_mime' => $data['attachmentMime'] ?? null,
            'attachment_data' => $data['attachmentData'] ?? null,
            'encoded_by' => $request->user()->id,
        ]);

        Notifier::send('claim_submitted', 'New claim submitted', "{$this->who($claim)} submitted a claim of " . number_format($claim->amount, 2) . '.', 'all', '/claims');

        return response()->json($this->format($claim), 201);
    }

    public function attachment(Claim $claim)
    {
        abort_unless($claim->attachment_data, 404);
        return [
            'name' => $claim->attachment_name,
            'mime' => $claim->attachment_mime,
            'data' => $claim->attachment_data,
        ];
    }

    public function approve(Request $request, Claim $claim)
    {
        if ($claim->status !== 'pending') {
            return $this->fail('Only a pending claim can be approved.');
        }
        $claim->update(['status' => 'approved', 'decided_by' => $request->user()->id, 'decided_at' => now()]);
                Notifier::send('claim_approved', 'Claim approved', "{$this->who($claim)}'s claim was approved.", 'all', '/claims');
        return $this->format($claim);
    }

    public function reject(Request $request, Claim $claim)
    {
        $data = $request->validate(['reason' => 'required|string|max:255']);
        if ($claim->status !== 'pending') {
            return $this->fail('Only a pending claim can be rejected.');
        }
        $claim->update([
            'status' => 'rejected',
            'reject_reason' => $data['reason'],
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);
        Notifier::send('claim_rejected', 'Claim rejected', "{$this->who($claim)}'s claim was rejected.", 'all', '/claims');
        return $this->format($claim);
    }

    public function markPaid(Request $request, Claim $claim)
    {
        $data = $request->validate([
            'paidAt' => 'required|date_format:Y-m-d',
            'paymentRef' => 'nullable|string|max:100',
        ]);
        if ($claim->status !== 'approved' || $claim->payroll_run_id) {
            return $this->fail('Only an approved claim that is not in a payroll can be marked as paid.');
        }
        $claim->update([
            'status' => 'paid',
            'paid_method' => 'manual',
            'paid_at' => $data['paidAt'],
            'payment_ref' => $data['paymentRef'] ?? null,
        ]);
        Notifier::send('claim_paid', 'Claim paid', "{$this->who($claim)}'s claim was marked as paid.", 'all', '/claims');
        return $this->format($claim);
    }

    public function destroy(Claim $claim)
    {
        if (! in_array($claim->status, ['pending', 'rejected'])) {
            return $this->fail('Only a pending or rejected claim can be deleted.');
        }
        $claim->delete();
        return response()->noContent();
    }

        private function who(Claim $c): string
    {
        return Employee::find($c->employee_id)?->name ?? 'An employee';
    }
}
