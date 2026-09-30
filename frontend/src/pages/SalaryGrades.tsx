import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Clock, DollarSign, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  addPosition,
  removePosition,
  updatePosition,
  usePositions,
  type Position,
} from '../lib/employeeStore'
import { peso } from '../lib/payroll'

const field = 'rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]'
const labelCls = 'text-xs font-semibold text-[var(--muted)]'

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

const TONES = {
  blue: 'bg-[#e4eaff] text-[#2f5bea]',
  orange: 'bg-[#fdebd3] text-[#b45309]',
  green: 'bg-[#d5f5e3] text-emerald-600',
}

const DOTS: Record<string, string> = { Finance: '#f59e0b', HR: '#10b981' }
const PALETTE = ['#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#f97316']
const deptColor = (d: string) =>
  DOTS[d] ?? PALETTE[[...d].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length]

function StatCard({
  icon, tone, label, value, note, pill,
}: { icon: ReactNode; tone: keyof typeof TONES; label: string; value: number; note: string; pill?: string }) {
  return (
    <div className="stat">
      <div className="flex items-start justify-between">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${TONES[tone]}`}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="mt-2 flex items-center text-sm text-[var(--muted)]">
        {note}
        {pill && <span className="pill pill-gray">{pill}</span>}
      </div>
    </div>
  )
}

type Form = { grade: string; department: string; name: string; salary: string }
const emptyForm: Form = { grade: '', department: '', name: '', salary: '' }

export default function SalaryGrades() {
  const positions = usePositions()
  const departments = [...new Set(positions.map((p) => p.department))].sort()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p: Position) => {
    setEditing(p)
    setForm({ grade: p.salaryGrade, department: p.department, name: p.name, salary: String(p.monthlySalary) })
    setError('')
    setModalOpen(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const salary = Number(form.salary)
    if (!form.grade.trim() || !form.department.trim() || !form.name.trim() || !(salary > 0)) return
    setSaving(true)
    setError('')
    const payload = {
      salaryGrade: form.grade.trim(),
      department: form.department.trim(),
      name: form.name.trim(),
      monthlySalary: salary,
    }
    try {
      if (editing) await updatePosition(editing.id, payload)
      else await addPosition(payload)
      setModalOpen(false)
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: Position) => {
    if (!confirm(`Delete ${p.name} (${p.department})?`)) return
    try {
      await removePosition(p.id)
    } catch (err) {
      alert(message(err))
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={openAdd} className="btn-primary">
          <Plus size={18} /> Add Salary Grade
        </button>
      </div>

      <div className="mb-7 grid gap-5 md:grid-cols-3">
        <StatCard icon={<DollarSign size={20} />} tone="blue" label="Salary Grades" value={positions.length} note="Active grades" />
        <StatCard icon={<Clock size={20} />} tone="orange" label="Pending Adjustments" value={0} note="Awaiting approval" pill="All clear" />
        <StatCard icon={<Check size={20} />} tone="green" label="Implemented (YTD)" value={0} note="Salary changes applied" pill="—" />
      </div>

      <div className="card overflow-x-auto">
        <div className="tbl-head">
          <div>
            <h2 className="text-lg font-bold">Grade Structure</h2>
            <p className="text-sm text-[var(--muted)]">
              {positions.length} of {positions.length} records
            </p>
          </div>
        </div>

        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {['Grade', 'Department', 'Position', 'Monthly Salary', 'Actions'].map((c) => (
                <th key={c} className={c === 'Actions' ? '!text-right' : ''}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr>
                <td colSpan={5} className="!py-12 text-center text-[var(--muted)]">
                  No salary grades yet.
                </td>
              </tr>
            )}
            {positions.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="tag-blue">
                    <span className="dot" style={{ background: '#2f5bea' }} />
                    {p.salaryGrade}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-2 text-[var(--muted)]">
                    <span className="dot" style={{ background: deptColor(p.department) }} />
                    {p.department}
                  </span>
                </td>
                <td className="font-bold">{p.name}</td>
                <td className="font-bold">{peso(p.monthlySalary)}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button aria-label="Edit" onClick={() => openEdit(p)} className="btn-icon">
                      <Pencil size={16} />
                    </button>
                    <button aria-label="Delete" onClick={() => remove(p)} className="btn-icon hover:!text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4">
          <form onSubmit={submit} className="card w-full max-w-lg p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? 'Edit salary grade' : 'Add salary grade'}</h3>
              <button type="button" aria-label="Close" onClick={() => setModalOpen(false)} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Grade *</label>
                <input className={field} style={{ borderColor: 'var(--line)' }} placeholder="SG-01" value={form.grade} onChange={(e) => set({ grade: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Monthly salary *</label>
                <input className={field} style={{ borderColor: 'var(--line)' }} type="number" min="0" value={form.salary} onChange={(e) => set({ salary: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Department *</label>
                <input className={field} style={{ borderColor: 'var(--line)' }} list="departments" value={form.department} onChange={(e) => set({ department: e.target.value })} />
                <datalist id="departments">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Position *</label>
                <input className={field} style={{ borderColor: 'var(--line)' }} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                Cancel
              </button>
              <button disabled={saving} className="btn-primary !px-5 !py-2.5 disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}