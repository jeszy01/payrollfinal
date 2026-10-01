import { useCallback, useEffect, useState } from 'react'
import { Download, RotateCcw, X } from 'lucide-react'
import { api } from '../lib/api'

type Log = {
  id: number
  userName: string | null
  role: string | null
  action: string
  module: string
  description: string
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}
type Result = { data: Log[]; total: number; page: number; lastPage: number }

const MODULES = ['Auth', 'Employees', 'Attendance', 'Payroll', 'Compensation', 'Benefits', 'Claims', 'Users']
const ACTIONS = [
  'Login', 'Failed login', 'Logout', 'Created', 'Updated', 'Deleted', 'Approved',
  'Rejected', 'Generated', 'Released', 'Marked as paid', 'Recorded',
]
const TONE: Record<string, string> = {
  'Failed login': 'bg-red-100 text-red-700',
  Deleted: 'bg-red-100 text-red-700',
  Rejected: 'bg-red-100 text-red-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Released: 'bg-emerald-100 text-emerald-700',
  'Marked as paid': 'bg-emerald-100 text-emerald-700',
  Created: 'bg-blue-100 text-blue-700',
  Generated: 'bg-blue-100 text-blue-700',
}

const field = 'rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand)]'
const bd = { borderColor: 'var(--line)' }
const empty = { from: '', to: '', module: '', action: '', q: '' }

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'medium' })

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export default function AuditLogs() {
  const [filters, setFilters] = useState(empty)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Result>({ data: [], total: 0, page: 1, lastPage: 1 })
  const [error, setError] = useState('')
  const [open, setOpen] = useState<Log | null>(null)

  const query = useCallback(
    (extra: Record<string, string> = {}) =>
      new URLSearchParams(Object.entries({ ...filters, ...extra }).filter(([, v]) => v)).toString(),
    [filters]
  )

  useEffect(() => {
    let alive = true
    const load = () =>
      api<Result>(`/audit-logs?${query({ page: String(page) })}`)
        .then((r) => {
          if (alive) {
            setResult(r)
            setError('')
          }
        })
        .catch((e) => {
          if (alive) setError(e instanceof Error ? e.message : 'Failed to load logs.')
        })
    const first = setTimeout(load, 250)
    const timer = setInterval(load, 5000)
    return () => {
      alive = false
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [query, page])

  const set = (patch: Partial<typeof empty>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const exportCsv = async () => {
    try {
      const rows = await api<Log[]>(`/audit-logs?${query({ export: '1' })}`)
      const header = ['Date', 'User', 'Role', 'Action', 'Module', 'Description', 'IP']
      const lines = rows.map((l) => [when(l.createdAt), l.userName ?? '', l.role ?? '', l.action, l.module, l.description, l.ip ?? ''])
      const csv = '\ufeff' + [header, ...lines].map((r) => r.map(csvCell).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit-logs.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input type="date" className={field} style={bd} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
        <input type="date" className={field} style={bd} value={filters.to} onChange={(e) => set({ to: e.target.value })} />
        <select className={field} style={bd} value={filters.module} onChange={(e) => set({ module: e.target.value })}>
          <option value="">All modules</option>
          {MODULES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className={field} style={bd} value={filters.action} onChange={(e) => set({ action: e.target.value })}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input
          className={`${field} min-w-52 flex-1`}
          style={bd}
          placeholder="Search user or description"
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <button className="btn-outline flex items-center gap-2" onClick={() => set(empty)}>
          <RotateCcw size={14} /> Reset
        </button>
        <button className="btn-outline flex items-center gap-2" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="tbl [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              {['When', 'User', 'Action', 'Module', 'Description'].map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={5} className="!py-12 text-center text-[var(--muted)]">No activity yet.</td>
              </tr>
            )}
            {result.data.map((l) => (
              <tr key={l.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(l)}>
                <td className="whitespace-nowrap">{when(l.createdAt)}</td>
                <td className="font-bold">
                  {l.userName ?? '—'}
                  {l.role && <div className="text-xs font-medium uppercase text-[var(--muted)]">{l.role}</div>}
                </td>
                <td>
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[l.action] ?? 'bg-slate-100 text-slate-700'}`}>
                    {l.action}
                  </span>
                </td>
                <td>{l.module}</td>
                <td>{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-[var(--muted)]" style={bd}>
          <span>{result.total} records · Page {result.page} of {result.lastPage}</span>
          <div className="flex gap-2">
            <button className="btn-outline !px-4 !py-1.5 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-outline !px-4 !py-1.5 disabled:opacity-50" disabled={page >= result.lastPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{open.description}</h3>
              <button aria-label="Close" onClick={() => setOpen(null)} className="text-[var(--muted)]">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">
              {open.userName ?? '—'} · {when(open.createdAt)}{open.ip ? ` · ${open.ip}` : ''}
            </p>
            <pre className="max-h-80 overflow-auto rounded-xl bg-slate-100 p-4 text-xs dark:bg-slate-800">
              {JSON.stringify(open.details ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}