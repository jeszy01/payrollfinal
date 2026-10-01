import CrudPage from '../components/CrudPage'
import { useEmployees } from '../lib/employeeStore'
import { peso } from '../lib/payroll'

type Loan = {
  id: string; employeeId: string; type: string
  principal: number; amortization: number; balance: number; startDate: string
}

const TYPES: Record<string, string> = { sss_loan: 'SSS loan', hdmf_loan: 'HDMF loan', cash_advance: 'Cash advance' }

export default function Loans() {
  const employees = useEmployees()
  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? '—'

  return (
    <CrudPage<Loan>
      resource="loans"
      title="Loans"
      addLabel="New Loan"
      fields={[
        { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: employees.map((e) => ({ value: e.id, label: e.name })) },
        { key: 'type', label: 'Type', type: 'select', required: true, options: Object.entries(TYPES).map(([value, label]) => ({ value, label })) },
        { key: 'principal', label: 'Amount', type: 'number', required: true },
        { key: 'amortization', label: 'Deduction per cut-off', type: 'number', required: true },
        { key: 'startDate', label: 'Start date', type: 'date', required: true },
      ]}
      columns={[
        { label: 'Employee', render: (r) => <strong>{empName(r.employeeId)}</strong> },
        { label: 'Type', render: (r) => TYPES[r.type] ?? r.type },
        { label: 'Amount', render: (r) => peso(r.principal) },
        { label: 'Per cut-off', render: (r) => peso(r.amortization) },
        { label: 'Balance', render: (r) => peso(r.balance) },
        {
          label: 'Status',
          render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${r.balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {r.balance > 0 ? 'Active' : 'Paid'}
            </span>
          ),
        },
      ]}
    />
  )
}