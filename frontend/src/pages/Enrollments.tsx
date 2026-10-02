import CrudPage from '../components/CrudPage'
import { useBenefits } from '../lib/benefitStore'
import { useEmployees } from '../lib/employeeStore'

type Enrollment = { id: string; employeeId: string; kind: 'hmo' | 'benefit'; hmoPlanId: string | null; companyBenefitId: string | null }
type Plan = { id: string; provider: string; name: string }


export default function Enrollments() {
  const employees = useEmployees()
  const plans = useBenefits<Plan>('hmo-plans')


  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? '—'
   const detail = (r: Enrollment) => {
    const p = plans.find((x) => x.id === r.hmoPlanId)
    return p ? `${p.provider} — ${p.name}` : '—'
  }

  return (
    <CrudPage<Enrollment>
      resource="enrollments"
      title="Enrollments"
      addLabel="New Enrollment"
      fields={[
        { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: employees.map((e) => ({ value: e.id, label: e.name })) },
        {
          key: 'kind', label: 'Type', type: 'select', required: true, default: 'hmo',
          options: [{ value: 'hmo', label: 'HMO' }],
        },
        {
          key: 'hmoPlanId', label: 'HMO plan', type: 'select', required: true,
          showIf: (f) => f.kind === 'hmo',
          options: plans.map((p) => ({ value: p.id, label: `${p.provider} — ${p.name}` })),
        },
       
      ]}
      columns={[
        { label: 'Employee', render: (r) => <strong>{empName(r.employeeId)}</strong> },
        { label: 'Enrolled in', render: detail },
      ]}
    />
  )
}