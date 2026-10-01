<?php

namespace App\Http\Controllers;

use App\Models\ClaimType;
use App\Models\CompanyBenefit;
use App\Models\EmployeeLoan;
use App\Models\Enrollment;
use App\Models\HmoPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BenefitController extends Controller
{
    private function cfg(string $resource): array
    {
        $map = [
            'hmo-plans' => [HmoPlan::class, [
                'provider' => 'required|string|max:100',
                'name' => 'required|string|max:100',
                'monthly_premium' => 'required|numeric|min:0',
                'employee_share' => 'required|numeric|min:0|max:100',
            ]],
            'company-benefits' => [CompanyBenefit::class, [
                'name' => 'required|string|max:100',
                'amount' => 'required|numeric|min:0',
                'basis' => 'required|in:monthly,per_day',
                'payslip_field' => 'nullable|in:transport_allowance,rice_allowance',
            ]],
            'enrollments' => [Enrollment::class, [
                'employee_id' => 'required|exists:employees,id',
                'kind' => 'required|in:hmo,benefit',
                'hmo_plan_id' => 'nullable|required_if:kind,hmo|exists:hmo_plans,id',
                'company_benefit_id' => 'nullable|required_if:kind,benefit|exists:company_benefits,id',
            ]],
                       'claim-types' => [ClaimType::class, [
                'name' => 'required|string|max:100',
                'max_amount' => 'nullable|numeric|min:0',
                'deadline_days' => 'nullable|integer|min:0',
                'receipt_required' => 'required|in:0,1',
            ]],
                'claim-types' => [ClaimType::class, [
                'name' => 'required|string|max:100',
                'max_amount' => 'nullable|numeric|min:0',
                'deadline_days' => 'nullable|integer|min:0',
                'receipt_required' => 'required|in:0,1',
            ]],
            'loans' => [EmployeeLoan::class, [
                'employee_id' => 'required|exists:employees,id',
                'type' => 'required|in:sss_loan,hdmf_loan,cash_advance',
                'principal' => 'required|numeric|min:0',
                'amortization' => 'required|numeric|min:0',
                'start_date' => 'required|date_format:Y-m-d',
            ]],
        ];
        abort_unless(isset($map[$resource]), 404);
        return $map[$resource];
    }

    private function input(Request $request): array
    {
        return collect($request->all())->mapWithKeys(fn ($v, $k) => [Str::snake($k) => $v])->all();
    }

    private function out($m): array
    {
        return collect($m->toArray())->mapWithKeys(fn ($v, $k) => [Str::camel($k) => $v])->all();
    }

    public function index(string $resource)
    {
        [$model] = $this->cfg($resource);
        return $model::latest()->get()->map(fn ($m) => $this->out($m));
    }

    public function store(Request $request, string $resource)
    {
        [$model, $rules] = $this->cfg($resource);
        $data = validator($this->input($request), $rules)->validate();
        if ($resource === 'loans') {
            $data['balance'] = $data['principal'];
        }
        return response()->json($this->out($model::create($data)), 201);
    }

    public function update(Request $request, string $resource, string $id)
    {
        [$model, $rules] = $this->cfg($resource);
        $row = $model::findOrFail($id);
        $row->update(validator($this->input($request), $rules)->validate());
        return $this->out($row->fresh());
    }

    public function destroy(string $resource, string $id)
    {
        [$model] = $this->cfg($resource);
        $model::findOrFail($id)->delete();
        return ['ok' => true];
    }
}
