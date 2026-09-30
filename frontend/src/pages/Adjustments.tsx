import { useState, type FormEvent } from 'react'
import { Check, Clock, Plus, X } from 'lucide-react'
import { addAdjustment, decideAdjustment, useAdjustments } from '../lib/adjustmentStore'
import { useEmployees, usePositions } from '../lib/employeeStore'
import { peso } from '../lib/payroll'

const field = 'rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]'
const labelCls = 'text-xs font-semibold text-[var(--muted)]'
const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

const STATUS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

type Form = { type: 'promotion' | 'market'; employeeId: string; newPositionId: string; positionId: string; newSalary: string; reason: string }
const emptyForm: Form = { type: 'promotion', employeeId: '', newPositionId: '', positionId: '', newSalary: '', reason: '' }

export default function Adjustments() {
  const adjustments = useAdjustments()
  const employees = useEmployees()
  const positions = usePositions()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const posLabel = (id: string | null) => {
    const p = positions.find((x) => x.id === id)
    return p ? `${p.name} (${p.department})` : '—'
  }
  const empName = (id: string | null) => employees.find((e) => e.id === id)?.name ?? '—'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addAdjustment(
        form.type === 'promotion'
          ? { type: 'promotion', employeeId: form.employeeId, newPositionId: form.newPositionId, reason: form.reason }
          : { type: 'market', positionId: form.positionId, newSalary: Number(form.newSalary), reason: form.reason }
      )
      setOpen(false)
      setForm(emptyForm)
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  const decide = async (id: string, action: 'approve' | 'reject') => {
    try {
      await decideAdjustment(id, action)
    } catch (err) {
      alert(message(err))
    }
  }

  const bd = { borderColor: 'var(--line)' }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => { setForm(emptyForm); setError(''); setOpen(true) }}
          className="btn-primary"
        >
          <Plus size={18} /> New Adjustment Request
        </button>
      </div>

      <div className="card overflow-x-auto">
        <div className="tbl-head">
          <div>
            <h2 className="text-lg font-bold">Requests</h2>
            <p className="text-sm text-[var(--muted)]">{adjustments.length} records</p>
          </div>
        </div>

        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {['Type', 'Target', 'Change', 'Reason', 'Status', 'Actions'].map((c) => (
                <th key={c} className={c === 'Actions' ? '!text-right' : ''}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={6} className="!py-12 text-center text-[var(--muted)]">No adjustment requests yet.</td>
              </tr>
            )}
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="tag-blue">{a.type === 'promotion' ? 'Promotion' : 'Market adjustment'}</span>
                </td>
                <td className="font-bold">
                  {a.type === 'promotion' ? (
                    <>
                      {empName(a.employeeId)}
                      <div className="text-xs font-medium text-[var(--muted)]">to {posLabel(a.newPositionId)}</div>
                    </>
                  ) : (
                    posLabel(a.positionId)
                  )}
                </td>
                <td className="whitespace-nowrap">
                  {peso(a.oldSalary)} → <strong>{peso(a.newSalary)}</strong>
                </td>
                <td className="max-w-[220px] truncate text-[var(--muted)]">{a.reason || '—'}</td>
                <td>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    {a.status === 'pending' && (
                      <>
                        <button aria-label="Approve" onClick={() => decide(a.id, 'approve')} className="btn-icon hover:!text-emerald-600">
                          <Check size={16} />
                        </button>
                        <button aria-label="Reject" onClick={() => decide(a.id, 'reject')} className="btn-icon hover:!text-red-600">
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {a.status !== 'pending' && <Clock size={16} className="text-[var(--muted)]" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4">
          <form onSubmit={submit} className="card w-full max-w-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">New adjustment request</h3>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Type *</label>
                <select className={field} style={bd} value={form.type} onChange={(e) => set({ type: e.target.value as Form['type'] })}>
                  <option value="promotion">Promotion</option>
                  <option value="market">Market adjustment</option>
                </select>
              </div>

              {form.type === 'promotion' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Employee *</label>
                    <select required className={field} style={bd} value={form.employeeId} onChange={(e) => set({ employeeId: e.target.value })}>
                      <option value="">Select employee</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>New position *</label>
                    <select required className={field} style={bd} value={form.newPositionId} onChange={(e) => set({ newPositionId: e.target.value })}>
                      <option value="">Select position</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.department}) — {peso(p.monthlySalary)}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>Position *</label>
                    <select required className={field} style={bd} value={form.positionId} onChange={(e) => set({ positionId: e.target.value })}>
                      <option value="">Select position</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.department}) — {peso(p.monthlySalary)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>New monthly salary *</label>
                    <input required type="number" min="0" className={field} style={bd} value={form.newSalary} onChange={(e) => set({ newSalary: e.target.value })} />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Reason</label>
                <textarea rows={3} className={field} style={bd} value={form.reason} onChange={(e) => set({ reason: e.target.value })} />
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
              <button disabled={saving} className="btn-primary !px-5 !py-2.5 disabled:opacity-60">
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}