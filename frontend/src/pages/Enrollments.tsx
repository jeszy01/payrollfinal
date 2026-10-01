import CrudPage from '../components/CrudPage'
import { useBenefits } from '../lib/benefitStore'
import { useEmployees } from '../lib/employeeStore'

type Enrollment = { id: string; employeeId: string; kind: 'hmo' | 'benefit'; hmoPlanId: string | null; companyBenefitId: string | null }
type Plan = { id: string; provider: string; name: string }
type Benefit = { id: string; name: string }

export default function Enrollments() {
  const employees = useEmployees()
  const plans = useBenefits<Plan>('hmo-plans')
  const benefits = useBenefits<Benefit>('company-benefits')

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? '—'
  const detail = (r: Enrollment) =>
    r.kind === 'hmo'
      ? (() => { const p = plans.find((x) => x.id === r.hmoPlanId); return p ? `${p.provider} — ${p.name}` : '—' })()
      : benefits.find((x) => x.id === r.companyBenefitId)?.name ?? '—'

  return (
    <CrudPage<Enrollment>
      resource="enrollments"
      title="Enrollments"
      addLabel="New Enrollment"
      fields={[
        { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: employees.map((e) => ({ value: e.id, label: e.name })) },
        {
          key: 'kind', label: 'Type', type: 'select', required: true, default: 'hmo',
          options: [{ value: 'hmo', label: 'HMO' }, { value: 'benefit', label: 'Company benefit' }],
        },
        {
          key: 'hmoPlanId', label: 'HMO plan', type: 'select', required: true,
          showIf: (f) => f.kind === 'hmo',
          options: plans.map((p) => ({ value: p.id, label: `${p.provider} — ${p.name}` })),
        },
        {
          key: 'companyBenefitId', label: 'Company benefit', type: 'select', required: true,
          showIf: (f) => f.kind === 'benefit',
          options: benefits.map((b) => ({ value: b.id, label: b.name })),
        },
      ]}
      columns={[
        { label: 'Employee', render: (r) => <strong>{empName(r.employeeId)}</strong> },
        { label: 'Type', render: (r) => (r.kind === 'hmo' ? 'HMO' : 'Company benefit') },
        { label: 'Enrolled in', render: detail },
      ]}
    />
  )
}