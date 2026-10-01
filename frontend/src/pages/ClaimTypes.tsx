import CrudPage from '../components/CrudPage'
import { peso } from '../lib/payroll'

type Type = { id: string; name: string; maxAmount: number | null; deadlineDays: number | null; receiptRequired: number }

export default function ClaimTypes() {
  return (
    <CrudPage<Type>
      resource="claim-types"
      title="Claim Types"
      addLabel="New Claim Type"
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'maxAmount', label: 'Max amount', type: 'number' },
        { key: 'deadlineDays', label: 'Submission deadline (days)', type: 'number' },
        {
          key: 'receiptRequired', label: 'Receipt', type: 'select', required: true, default: '1',
          options: [{ value: '1', label: 'Required' }, { value: '0', label: 'Optional' }],
        },
      ]}
      columns={[
        { label: 'Name', render: (r) => <strong>{r.name}</strong> },
        { label: 'Max amount', render: (r) => (r.maxAmount != null ? peso(r.maxAmount) : 'No limit') },
        { label: 'Deadline', render: (r) => (r.deadlineDays != null ? `${r.deadlineDays} days` : 'None') },
        { label: 'Receipt', render: (r) => (r.receiptRequired ? 'Required' : 'Optional') },
      ]}
    />
  )
}