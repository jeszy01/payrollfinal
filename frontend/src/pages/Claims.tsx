import { useState, type FormEvent } from 'react'
import { Check, Eye, Plus, Trash2, X } from 'lucide-react'
import { currentUser } from '../lib/auth'
import { useBenefits } from '../lib/benefitStore'
import {
  addClaim, approveClaim, getAttachment, payClaim, rejectClaim, removeClaim, useClaims, type Claim,
} from '../lib/claimStore'
import { useEmployees } from '../lib/employeeStore'
import { peso, todayStr } from '../lib/payroll'

type ClaimType = { id: string; name: string; receiptRequired: number }

const field = 'rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]'
const labelCls = 'text-xs font-semibold text-[var(--muted)]'
const overlay = 'fixed inset-0 z-30 grid place-items-center bg-black/50 p-4'
const bd = { borderColor: 'var(--line)' }
const MAX_BYTES = 2 * 1024 * 1024
const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

const STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  paid: 'bg-blue-100 text-blue-700',
}

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(new Error('Could not read the file.'))
    r.readAsDataURL(file)
  })

const note = (c: Claim) =>
  c.status === 'rejected'
    ? c.rejectReason
    : c.status === 'paid'
      ? c.paidMethod === 'payroll'
        ? 'Paid via payroll'
        : `Paid manually${c.paymentRef ? ` · ${c.paymentRef}` : ''}`
      : c.status === 'approved' && c.payrollRunId
        ? 'In payroll'
        : null

const emptyForm = () => ({ employeeId: '', claimTypeId: '', expenseDate: todayStr(), amount: '', description: '' })

export default function Claims() {
  const claims = useClaims()
  const employees = useEmployees()
  const types = useBenefits<ClaimType>('claim-types')
  const isAdmin = currentUser()?.role === 'admin'

  const [filter, setFilter] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [payId, setPayId] = useState<string | null>(null)
  const [pay, setPay] = useState({ paidAt: todayStr(), paymentRef: '' })
  const [receipt, setReceipt] = useState<{ name: string; mime: string; url: string } | null>(null)

  const empName = (id: string) => employees.find((e) => e.id === id)?.name ?? '—'
  const typeName = (id: string | null) => types.find((t) => t.id === id)?.name ?? '—'
  const needsReceipt = !!types.find((t) => t.id === form.claimTypeId)?.receiptRequired
  const filtered = claims.filter((c) => !filter || c.status === filter)

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
    } catch (err) {
      alert(message(err))
    }
  }

  const openNew = () => {
    setForm(emptyForm())
    setFile(null)
    setError('')
    setNewOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (file && file.size > MAX_BYTES) throw new Error('File must be 2 MB or smaller.')
      await addClaim({
        employeeId: form.employeeId,
        claimTypeId: form.claimTypeId,
        expenseDate: form.expenseDate,
        amount: Number(form.amount),
        description: form.description.trim() || null,
        ...(file ? { attachmentName: file.name, attachmentMime: file.type, attachmentData: await toBase64(file) } : {}),
      })
      setNewOpen(false)
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  const view = (c: Claim) =>
    run(async () => {
      const att = await getAttachment(c.id)
      const bytes = Uint8Array.from(atob(att.data), (ch) => ch.charCodeAt(0))
      setReceipt({ name: att.name, mime: att.mime, url: URL.createObjectURL(new Blob([bytes], { type: att.mime })) })
    })

  const closeReceipt = () => {
    if (receipt) URL.revokeObjectURL(receipt.url)
    setReceipt(null)
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={openNew} className="btn-primary">
          <Plus size={18} /> New Claim
        </button>
      </div>

      <div className="card overflow-x-auto">
        <div className="tbl-head">
          <div>
            <h2 className="text-lg font-bold">Claims</h2>
            <p className="text-sm text-[var(--muted)]">{filtered.length} records</p>
          </div>
          <select className={field} style={bd} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {['Employee', 'Type', 'Date', 'Amount', 'Status', 'Receipt', 'Actions'].map((c) => (
                <th key={c} className={c === 'Actions' ? '!text-right' : ''}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="!py-12 text-center text-[var(--muted)]">No claims yet.</td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-bold">
                  {empName(c.employeeId)}
                  {c.description && (
                    <div className="max-w-[220px] truncate text-xs font-medium text-[var(--muted)]">{c.description}</div>
                  )}
                </td>
                <td>{typeName(c.claimTypeId)}</td>
                <td className="whitespace-nowrap">{c.expenseDate}</td>
                <td className="whitespace-nowrap font-bold">{peso(c.amount)}</td>
                <td>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[c.status]}`}>
                    {c.status}
                  </span>
                  {note(c) && <div className="mt-1 text-xs text-[var(--muted)]">{note(c)}</div>}
                </td>
                <td>
                  {c.hasAttachment ? (
                    <button aria-label="View receipt" onClick={() => view(c)} className="btn-icon">
                      <Eye size={16} />
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    {isAdmin && c.status === 'pending' && (
                      <>
                        <button aria-label="Approve" onClick={() => run(() => approveClaim(c.id))} className="btn-icon hover:!text-emerald-600">
                          <Check size={16} />
                        </button>
                        <button aria-label="Reject" onClick={() => { setReason(''); setRejectId(c.id) }} className="btn-icon hover:!text-red-600">
                          <X size={16} />
                        </button>
                      </>
                    )}
                    {c.status === 'approved' && !c.payrollRunId && (
                      <button
                        className="btn-outline whitespace-nowrap !px-3 !py-1.5 text-xs"
                        onClick={() => { setPay({ paidAt: todayStr(), paymentRef: '' }); setPayId(c.id) }}
                      >
                        Mark as paid
                      </button>
                    )}
                    {(c.status === 'pending' || c.status === 'rejected') && (
                      <button
                        aria-label="Delete"
                        onClick={() => confirm('Delete this claim?') && run(() => removeClaim(c.id))}
                        className="btn-icon hover:!text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {newOpen && (
        <div className={overlay}>
          <form onSubmit={submit} className="card w-full max-w-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">New claim</h3>
              <button type="button" aria-label="Close" onClick={() => setNewOpen(false)} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Employee *</label>
                <select required className={field} style={bd} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Claim type *</label>
                <select required className={field} style={bd} value={form.claimTypeId} onChange={(e) => setForm({ ...form, claimTypeId: e.target.value })}>
                  <option value="">Select type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Expense date *</label>
                  <input required type="date" max={todayStr()} className={field} style={bd} value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Amount *</label>
                  <input required type="number" min="0.01" step="any" className={field} style={bd} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Description</label>
                <textarea rows={2} className={field} style={bd} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Receipt{needsReceipt ? ' *' : ''}</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className={field}
                  style={bd}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setNewOpen(false)} className="btn-outline">Cancel</button>
              <button disabled={saving} className="btn-primary !px-5 !py-2.5 disabled:opacity-60">
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {rejectId && (
        <div className={overlay}>
          <form
            className="card w-full max-w-sm p-6"
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                await rejectClaim(rejectId, reason.trim())
                setRejectId(null)
              })
            }}
          >
            <h3 className="mb-4 text-lg font-bold">Reject claim</h3>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Reason *</label>
              <textarea required rows={3} className={field} style={bd} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRejectId(null)} className="btn-outline">Cancel</button>
              <button className="btn-primary !px-5 !py-2.5">Reject</button>
            </div>
          </form>
        </div>
      )}

      {payId && (
        <div className={overlay}>
          <form
            className="card w-full max-w-sm p-6"
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                await payClaim(payId, pay.paidAt, pay.paymentRef.trim())
                setPayId(null)
              })
            }}
          >
            <h3 className="mb-4 text-lg font-bold">Mark as paid</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Paid date *</label>
                <input required type="date" className={field} style={bd} value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Reference no.</label>
                <input className={field} style={bd} value={pay.paymentRef} onChange={(e) => setPay({ ...pay, paymentRef: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setPayId(null)} className="btn-outline">Cancel</button>
              <button className="btn-primary !px-5 !py-2.5">Confirm</button>
            </div>
          </form>
        </div>
      )}

      {receipt && (
        <div className={overlay} onClick={closeReceipt}>
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="truncate font-bold">{receipt.name}</h3>
              <button aria-label="Close" onClick={closeReceipt} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>
            {receipt.mime === 'application/pdf' ? (
              <iframe src={receipt.url} title={receipt.name} className="h-[75vh] w-full rounded-lg" />
            ) : (
              <img src={receipt.url} alt={receipt.name} className="mx-auto max-h-[75vh] rounded-lg" />
            )}
          </div>
        </div>
      )}
    </>
  )
}