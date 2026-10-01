import { useMemo, useState, type FormEvent } from 'react'
import { Download, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import {
  addEmployee,
  removeEmployee,
  updateEmployee,
  useEmployees,
  usePositions,
  type Employee,
} from '../lib/employeeStore'
import { peso, todayStr } from '../lib/payroll'

const STATUSES = ['Active', 'Inactive', 'On Leave', 'Resigned']
const EMPLOYMENT_TYPES = ['Regular', 'Probationary', 'Contractual', 'Part-time']
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated']
const WORKING_DAYS = 22 // preview only; the backend computes the real daily rate

const field =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0b1220]'
const labelCls = 'text-xs font-medium text-slate-500'
const AVATAR_COLORS = ['#2f5fe0', '#2b6a86', '#c97b5a', '#7c5ac9', '#2f9e6f', '#c9a13a']

type Form = {
  name: string
  email: string
  phone: string
  positionId: string
  employmentType: string
  civilStatus: string
  status: string
  dateHired: string
}

const emptyForm = (): Form => ({
  name: '',
  email: '',
  phone: '',
  positionId: '',
  employmentType: 'Regular',
  civilStatus: '',
  status: 'Active',
  dateHired: todayStr(),
})

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const avatarColor = (name: string) =>
  AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

const formatDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const badge = (status: string) =>
  status === 'Active'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

export default function EmployeeData() {
  const employees = useEmployees()
  const positions = usePositions()

  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<Form>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const departments = useMemo(() => [...new Set(positions.map((p) => p.department))].sort(), [positions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter(
      (e) =>
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.employeeNo.toLowerCase().includes(q) ||
          (e.email ?? '').toLowerCase().includes(q)) &&
        (!dept || e.department === dept) &&
        (!statusFilter || e.status === statusFilter)
    )
  }, [employees, search, dept, statusFilter])

 
  const selectedPosition = positions.find((p) => p.id === form.positionId)

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setModalOpen(true)
  }

  const openEdit = (e: Employee) => {
    setEditing(e)
    setForm({
      name: e.name,
      email: e.email ?? '',
      phone: e.phone ?? '',
      positionId: e.positionId,
      employmentType: e.employmentType,
      civilStatus: e.civilStatus ?? '',
      status: e.status,
      dateHired: e.dateHired,
    })
    setError('')
    setModalOpen(true)
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!form.name.trim() || !form.positionId || !form.dateHired) return
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      positionId: form.positionId,
      employmentType: form.employmentType,
      civilStatus: form.civilStatus || null,
      status: form.status,
      dateHired: form.dateHired,
    }
    try {
      if (editing) await updateEmployee(editing.id, payload)
      else await addEmployee(payload)
      setModalOpen(false)
    } catch (err) {
      setError(message(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (e: Employee) => {
    if (!confirm(`Delete ${e.name}?`)) return
    try {
      await removeEmployee(e.id)
    } catch (err) {
      alert(message(err))
    }
  }

  const exportCsv = () => {
    const header = ['Employee #', 'Name', 'Email', 'Phone', 'Position', 'Department', 'Date Hired', 'Base Salary', 'Daily Rate', 'Status']
    const rows = filtered.map((e) => [
      e.employeeNo, e.name, e.email ?? '', e.phone ?? '', e.position, e.department,
      e.dateHired, e.baseSalary, e.dailyRate, e.status,
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'employees.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const resetFilters = () => {
    setSearch('')
    setDept('')
    setStatusFilter('')
  }

  return (
    <>
            <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-[#2f5fe0] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#131c2e]">
       

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex min-w-60 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-500 dark:border-slate-700 dark:bg-[#0b1220]">
            <Search size={16} />
            <input
              className="flex-1 bg-transparent text-sm text-inherit outline-none"
              placeholder="Search name, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={field} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select className={field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-500 dark:border-slate-700"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Employee', 'Position / Dept', 'Employee #', 'Date Hired', 'Base Salary', 'Daily Rate', 'Status', ''].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap border-b border-slate-200 px-5 py-3.5 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                        style={{ background: avatarColor(e.name) }}
                      >
                        {initials(e.name)}
                      </div>
                      <div className="leading-tight">
                        <div className="font-semibold">{e.name}</div>
                        <div className="text-xs text-slate-500">{e.email ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 leading-tight">
                    <div className="font-medium">{e.position}</div>
                    <div className="text-xs text-slate-500">{e.department}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium">{e.employeeNo}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">{formatDate(e.dateHired)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">{peso(e.baseSalary)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">{peso(e.dailyRate)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(e.status)}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-3 text-slate-500">
                      <button aria-label="Edit" onClick={() => openEdit(e)} className="hover:text-[#2f5fe0]">
                        <Pencil size={16} />
                      </button>
                      <button aria-label="Delete" onClick={() => remove(e)} className="hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4">
          <form
            onSubmit={submit}
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#131c2e]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" aria-label="Close" onClick={() => setModalOpen(false)} className="text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Full name *</label>
                <input className={field} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Email</label>
                <input className={field} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Phone</label>
                <input className={field} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Date hired *</label>
                <input className={field} type="date" value={form.dateHired} onChange={(e) => set({ dateHired: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className={labelCls}>Position / Department *</label>
                <select className={field} value={form.positionId} onChange={(e) => set({ positionId: e.target.value })}>
                  <option value="">Select a position...</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.department} ({p.salaryGrade})
                    </option>
                  ))}
                </select>
                {selectedPosition && (
                  <span className="text-xs text-slate-500">
                    {peso(selectedPosition.monthlySalary)} / month · about {peso(selectedPosition.monthlySalary / WORKING_DAYS)} / day
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Employment type</label>
                <select className={field} value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })}>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Civil status</label>
                <select className={field} value={form.civilStatus} onChange={(e) => set({ civilStatus: e.target.value })}>
                  <option value="">—</option>
                  {CIVIL_STATUSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Status</label>
                <select className={field} value={form.status} onChange={(e) => set({ status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
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
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}