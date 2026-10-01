import CrudPage from '../components/CrudPage'
import { peso } from '../lib/payroll'

type Plan = { id: string; provider: string; name: string; monthlyPremium: number; employeeShare: number }

export default function HmoPlans() {
  return (
    <CrudPage<Plan>
      resource="hmo-plans"
      title="Plans"
      addLabel="New HMO Plan"
      fields={[
        { key: 'provider', label: 'Provider', required: true },
        { key: 'name', label: 'Plan name', required: true },
        { key: 'monthlyPremium', label: 'Monthly premium', type: 'number', required: true },
        { key: 'employeeShare', label: 'Employee share (%)', type: 'number', required: true, default: '0' },
      ]}
      columns={[
        { label: 'Provider', render: (r) => r.provider },
        { label: 'Plan', render: (r) => <strong>{r.name}</strong> },
        { label: 'Monthly premium', render: (r) => peso(r.monthlyPremium) },
        { label: 'Employee share', render: (r) => `${r.employeeShare}%` },
        { label: 'Employee pays', render: (r) => peso((r.monthlyPremium * r.employeeShare) / 100) },
      ]}
    />
  )
}