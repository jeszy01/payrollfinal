import CrudPage from '../components/CrudPage'
import { peso } from '../lib/payroll'

type Benefit = { id: string; name: string; amount: number; basis: 'monthly' | 'per_day'; payslipField: string | null }

const FIELDS: Record<string, string> = { transport_allowance: 'Transportation allowance', rice_allowance: 'Rice allowance' }

export default function CompanyBenefits() {
  return (
    <CrudPage<Benefit>
      resource="company-benefits"
      title="Benefits"
      addLabel="New Benefit"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        {
          key: 'basis', label: 'Basis', type: 'select', required: true, default: 'monthly',
          options: [{ value: 'monthly', label: 'Monthly' }, { value: 'per_day', label: 'Per day worked' }],
        },
        {
          key: 'payslipField', label: 'Payslip line', type: 'select',
          options: Object.entries(FIELDS).map(([value, label]) => ({ value, label })),
        },
      ]}
      columns={[
        { label: 'Name', render: (r) => <strong>{r.name}</strong> },
        { label: 'Amount', render: (r) => peso(r.amount) },
        { label: 'Basis', render: (r) => (r.basis === 'monthly' ? 'Monthly' : 'Per day worked') },
        { label: 'Payslip line', render: (r) => (r.payslipField ? FIELDS[r.payslipField] : '—') },
      ]}
    />
  )
}