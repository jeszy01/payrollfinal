import { useCallback, useEffect, useMemo, useState } from 'react'
import { currentUser } from '../lib/auth'
import { useEmployees } from '../lib/employeeStore'
import { computeDay, cutoffOf, peso, todayStr } from '../lib/payroll'
import {
  approveRun, deleteRun, generateRun, getRun, listRuns, releaseRun,
  type PayrollRun,
} from '../lib/payrollRunStore'
import { useSettings } from '../lib/settingsStore'
import { useAttendance } from '../lib/useAttendance'

const liveCols = ['Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent', 'Total Salary']
const runCols = ['Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent', 'Gross', 'Deductions', 'OT Pay', 'Net Pay']

const hrs = (mins: number) => {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(' ')
}

const label = (r: PayrollRun) => `${r.periodStart} to ${r.periodEnd}`

const badgeStyle: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
}

type Row = { id: string; name: string; days: number; late: number; under: number; over: number; absent: number; total: number }

export default function Payroll() {
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [picked, setPicked] = useState('')
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [detail, setDetail] = useState<PayrollRun | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const records = useAttendance()
  const employees = useEmployees()
  const { cutoffDay } = useSettings()
  const isAdmin = currentUser()?.role === 'admin'
  const current = cutoffOf(todayStr(), cutoffDay)

  const refresh = useCallback(
    () => listRuns().then(setRuns).catch((e) => setError(e.message)),
    []
  )
  useEffect(() => { refresh() }, [refresh])

  const pending = runs.filter((r) => r.status !== 'released')
  const released = runs.filter((r) => r.status === 'released')
  const list = tab === 'active' ? pending : released
  const shown = list.find((r) => r.id === picked) ?? list[0]

  useEffect(() => {
    if (!shown) { setDetail(null); return }
    getRun(shown.id).then(setDetail).catch((e) => setError(e.message))
  }, [shown?.id, shown?.status])

  const act = async (fn: () => Promise<unknown>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setBusy(true)
    setError('')
    try {
      await fn()
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  // Live preview of the current cutoff (shown only when no saved run is pending)
  const rows = useMemo<Row[]>(() => {
    return employees
      .filter((e) => e.status === 'Active')
      .map((emp) => {
        const row: Row = { id: emp.id, name: emp.name, days: 0, late: 0, under: 0, over: 0, absent: 0, total: 0 }
        let gross = 0
        let deduction = 0
        let overtimePay = 0
        for (const r of records) {
          if (r.employeeId !== emp.id || r.date < current.start || r.date > current.end) continue
          const c = computeDay(r)
          if (c.status !== 'absent') {
            row.days += 1
            gross += r.dailyRate ?? emp.dailyRate
            deduction += c.deduction
          }
          row.late += c.lateMinutes
          row.under += c.undertimeMinutes
          row.over += c.overtimeMinutes
          row.absent += c.absences
          overtimePay += c.overtimePay
        }
        row.total = Math.max(0, gross - deduction) + overtimePay
        return row
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, records, current.start, current.end])

  const showLive = tab === 'active' && !shown

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="card inline-flex gap-1 p-1">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPicked('') }}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {list.length > 1 ? (
          <select
            value={shown?.id}
            onChange={(e) => setPicked(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--line)' }}
          >
            {list.map((r) => (
              <option key={r.id} value={r.id}>{label(r)}</option>
            ))}
          </select>
        ) : shown ? (
          <span className="text-sm font-semibold text-[var(--muted)]">{label(shown)}</span>
        ) : showLive ? (
          <span className="text-sm font-semibold text-[var(--muted)]">{current.label}</span>
        ) : null}

        {shown && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeStyle[shown.status]}`}>
            {shown.status}
          </span>
        )}

        <div className="ml-auto flex gap-2">
          {showLive && (
            <button
              className="btn-primary"
              disabled={busy || rows.length === 0}
              onClick={() =>
                act(() => generateRun(current.start, current.end), `Generate payroll for ${current.label}?`)
              }
            >
              Generate Payroll
            </button>
          )}
          {shown?.status === 'draft' && (
            <>
              <button
                className="btn-icon px-4 text-red-600"
                disabled={busy}
                onClick={() => act(() => deleteRun(shown.id), 'Delete this draft payroll?')}
              >
                Delete draft
              </button>
              {isAdmin && (
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => act(() => approveRun(shown.id), 'Approve this payroll?')}
                >
                  Approve
                </button>
              )}
            </>
          )}
          {shown?.status === 'approved' && isAdmin && (
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => act(() => releaseRun(shown.id), 'Release this payroll? It will move to Archived.')}
            >
              Release
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-x-auto">
        {showLive ? (
          <table className="tbl">
            <thead>
              <tr>{liveCols.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={liveCols.length} className="!py-12 text-center text-[var(--muted)]">
                    No active employees yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold">{r.name}</td>
                  <td>{r.days}</td>
                  <td>{hrs(r.late)}</td>
                  <td>{hrs(r.under)}</td>
                  <td>{hrs(r.over)}</td>
                  <td>{r.absent || '—'}</td>
                  <td className="font-bold">{peso(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="tbl">
            <thead>
              <tr>{runCols.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {!detail?.payslips?.length && (
                <tr>
                  <td colSpan={runCols.length} className="!py-12 text-center text-[var(--muted)]">
                    {tab === 'archived' ? 'No released payroll yet.' : 'Loading...'}
                  </td>
                </tr>
              )}
              {detail?.payslips?.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.employeeName}</td>
                  <td>{p.daysWorked}</td>
                  <td>{hrs(p.lateMinutes)}</td>
                  <td>{hrs(p.undertimeMinutes)}</td>
                  <td>{hrs(p.overtimeMinutes)}</td>
                  <td>{p.absences || '—'}</td>
                  <td>{peso(p.gross)}</td>
                  <td>{peso(p.deduction)}</td>
                  <td>{peso(p.overtimePay)}</td>
                  <td className="font-bold">{peso(p.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}