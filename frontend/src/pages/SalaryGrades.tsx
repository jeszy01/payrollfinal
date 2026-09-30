import { useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, ClipboardList, Pencil, Plus, Trash2, TrendingUp, X } from 'lucide-react'
import {
  addPosition,
  removePosition,
  updatePosition,
  usePositions,
  type Position,
} from '../lib/employeeStore'
import { peso } from '../lib/payroll'

const field =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0b1220]'
const labelCls = 'text-xs font-medium text-slate-500'

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

const TONES = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
}

function StatCard({
  icon, tone, label, value, note,
}: { icon: ReactNode; tone: keyof typeof TONES; label: string; value: number; note: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-[#131c2e]">
      <div className="absolute -right-5 -top-5 size-16 rounded-full bg-slate-100 dark:bg-slate-800/60" />
      <div className={`relative mb-2 grid size-8 place-items-center rounded-lg ${TONES[tone]}`}>{icon}</div>
      <div className="relative text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="relative text-xl font-bold leading-tight">{value}</div>
      <div className="relative text-xs text-slate-400">{note}</div>
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
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<TrendingUp size={16} />} tone="blue" label="Salary grades" value={positions.length} note="Active grades" />
        <StatCard icon={<ClipboardList size={16} />} tone="orange" label="Pending adjustments" value={0} note="Awaiting approval" />
        <StatCard icon={<CheckCircle2 size={16} />} tone="green" label="Implemented (YTD)" value={0} note="Salary changes applied" />
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-[#2f5fe0] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Add salary grade
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#131c2e]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Grade', 'Department', 'Position', 'Monthly salary', ''].map((c, i) => (
                <th
                  key={i}
                  className={`whitespace-nowrap border-b border-slate-200 px-5 py-3.5 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 ${
                    c === 'Monthly salary' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-500">
                  No salary grades yet.
                </td>
              </tr>
            )}
            {positions.map((p) => (
              <tr key={p.id} className="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                <td className="whitespace-nowrap px-5 py-3.5 font-semibold">{p.salaryGrade}</td>
                <td className="px-5 py-3.5">{p.department}</td>
                <td className="px-5 py-3.5">{p.name}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">{peso(p.monthlySalary)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-3 text-slate-500">
                    <button aria-label="Edit" onClick={() => openEdit(p)} className="hover:text-[#2f5fe0]">
                      <Pencil size={16} />
                    </button>
                    <button aria-label="Delete" onClick={() => remove(p)} className="hover:text-red-600">
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
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#131c2e]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? 'Edit salary grade' : 'Add salary grade'}</h3>
              <button type="button" aria-label="Close" onClick={() => setModalOpen(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Grade *</label>
                <input className={field} placeholder="SG-01" value={form.grade} onChange={(e) => set({ grade: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Monthly salary *</label>
                <input className={field} type="number" min="0" value={form.salary} onChange={(e) => set({ salary: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Department *</label>
                <input className={field} list="departments" value={form.department} onChange={(e) => set({ department: e.target.value })} />
                <datalist id="departments">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Position *</label>
                <input className={field} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-[#2f5fe0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}