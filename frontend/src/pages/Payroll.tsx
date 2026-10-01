import { useCallback, useEffect, useMemo, useState } from 'react'
import PayslipModal from '../components/PayslipModal'
import { currentUser } from '../lib/auth'
import { useEmployees } from '../lib/employeeStore'
import { computeDay, cutoffOf, peso, todayStr } from '../lib/payroll'
import {
  approveRun, deleteRun, generateRun, getRun, listRuns, releaseRun,
  type PayrollRun, type PayslipRow,
} from '../lib/payrollRunStore'
import { useSettings } from '../lib/settingsStore'
import { useAttendance } from '../lib/useAttendance'
import CutoffClock from '../components/CutoffClock'

const liveCols = ['Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent', 'Total Salary']
const summaryCols = [
  'Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent',
  'Gross', 'OT Pay', 'Deductions', 'Benefits', 'Claims', 'Net Pay',
]

const hrs = (mins: number) => {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(' ')
}
const m = (v: number) => (v ? peso(v) : '—')
const n = (v?: number | string | null) => Number(v ?? 0)
const label = (r: PayrollRun) => `${r.periodStart} to ${r.periodEnd}`

const badgeStyle: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
}

type Row = {
  id: string; name: string; days: number; late: number; under: number; over: number; absent: number
  gross: number; deduction: number; otPay: number; total: number
}

type Summary = {
  id: string; name: string; days: number; late: number; under: number; over: number; absent: number
  gross: number; otPay: number; deductions: number; benefits: number; claims: number; net: number
  slip?: PayslipRow
}

const fromRow = (r: Row): Summary => ({
  id: r.id, name: r.name, days: r.days, late: r.late, under: r.under, over: r.over, absent: r.absent,
  gross: r.gross, otPay: r.otPay, deductions: r.deduction, benefits: 0, claims: 0, net: r.total,
})

const fromSlip = (p: PayslipRow): Summary => ({
  id: p.id, name: p.employeeName, days: p.daysWorked, late: p.lateMinutes, under: p.undertimeMinutes,
  over: p.overtimeMinutes, absent: p.absences, gross: p.gross, otPay: p.overtimePay,
  deductions: p.deduction + n(p.cashAdvance) + n(p.sssLoan) + n(p.hdmfLoan),
  benefits: n(p.sss) + n(p.philhealth) + n(p.pagIbig),
  claims: n(p.claims) + n(p.transportAllowance) + n(p.riceAllowance),
  net: p.netPay, slip: p,
})

const csvCell = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(run: PayrollRun, slips: PayslipRow[]) {
  const header = [
    'Employee', 'Employee No.', 'Days Worked', 'Late (min)', 'Undertime (min)', 'Overtime (min)', 'Absences',
    'Gross', 'Deductions', 'OT Pay', 'SSS', 'PhilHealth', 'HDMF', 'Cash Advance', 'SSS Loan', 'HDMF Loan',
    'Transportation Allowance', 'Rice Subsidy Allowance', 'Net Pay',
  ]
  const lines = slips.map((p) => [
    p.employeeName, p.employeeNo, p.daysWorked, p.lateMinutes, p.undertimeMinutes, p.overtimeMinutes, p.absences,
    p.gross, p.deduction, p.overtimePay, n(p.sss), n(p.philhealth), n(p.pagIbig), n(p.cashAdvance),
    n(p.sssLoan), n(p.hdmfLoan), n(p.transportAllowance), n(p.riceAllowance), p.netPay,
  ])
  const csv = '\ufeff' + [header, ...lines].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `payroll-${run.periodStart}_to_${run.periodEnd}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function SummaryTable({ items, empty, status, onView }: {
  items: Summary[]
  empty: string
  status?: string
  onView: (p: PayslipRow) => void
}) {
  const saved = !!status
  const cols = saved ? [...summaryCols, 'Status', ''] : summaryCols
  return (
    <table className="tbl">
      <thead>
        <tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={cols.length} className="!py-12 text-center text-[var(--muted)]">{empty}</td>
          </tr>
        )}
        {items.map((s) => (
          <tr key={s.id}>
            <td className="font-bold">{s.name}</td>
            <td>{s.days}</td>
            <td>{hrs(s.late)}</td>
            <td>{hrs(s.under)}</td>
            <td>{hrs(s.over)}</td>
            <td>{s.absent || '—'}</td>
            <td>{peso(s.gross)}</td>
            <td>{m(s.otPay)}</td>
            <td>{m(s.deductions)}</td>
            <td>{m(s.benefits)}</td>
            <td>{m(s.claims)}</td>
            <td className="font-bold">{peso(s.net)}</td>
            {saved && (
              <>
                <td>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeStyle[status ?? 'draft']}`}>
                    {status}
                  </span>
                </td>
                <td>
                  {status === 'released' && s.slip && (
                    <button
                      className="whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-slate-50"
                      style={{ borderColor: 'var(--line)' }}
                      onClick={() => onView(s.slip!)}
                    >
                      View payslip
                    </button>
                  )}
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Payroll() {
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [picked, setPicked] = useState('')
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [detail, setDetail] = useState<PayrollRun | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [slip, setSlip] = useState<PayslipRow | null>(null)
  const [review, setReview] = useState(false)
  const [ask, setAsk] = useState<{ title: string; message: string; onYes: () => void } | null>(null)

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

    const activeRun = runs.find(
    (r) => r.periodStart === current.start && r.periodEnd === current.end && r.status !== 'released'
  )
  const archivedList = runs.filter((r) => r.id !== activeRun?.id)

  const shown = tab === 'active' ? activeRun : (archivedList.find((r) => r.id === picked) ?? archivedList[0])
  const showLive = tab === 'active' && !activeRun
  const showReview = showLive && review

  // Leave the review page once the payroll has been saved
  useEffect(() => { if (activeRun) setReview(false) }, [activeRun?.id])

  useEffect(() => {
    if (!shown) { setDetail(null); return }
    getRun(shown.id).then(setDetail).catch((e) => setError(e.message))
  }, [shown?.id, shown?.status])

  const slips = detail && detail.id === shown?.id ? detail.payslips : null

  const act = async (fn: () => Promise<unknown>) => {
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

  // Real-time calculation of the current cutoff
  const rows = useMemo<Row[]>(() => {
    return employees
      .filter((e) => e.status === 'Active')
      .map((emp) => {
        const row: Row = {
          id: emp.id, name: emp.name, days: 0, late: 0, under: 0, over: 0, absent: 0,
          gross: 0, deduction: 0, otPay: 0, total: 0,
        }
        for (const r of records) {
                  if (r.employeeId !== emp.id || r.payrollRunId || r.date < current.start || r.date > current.end) continue
          const c = computeDay(r)
          if (c.status !== 'absent') {
            row.days += 1
            row.gross += r.dailyRate ?? emp.dailyRate
            row.deduction += c.deduction
          }
          row.late += c.lateMinutes
          row.under += c.undertimeMinutes
          row.over += c.overtimeMinutes
          row.absent += c.absences
          row.otPay += c.overtimePay
        }
        row.total = Math.max(0, row.gross - row.deduction) + row.otPay
        return row
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, records, current.start, current.end])

  const emptyMsg = tab === 'archived' && !shown ? 'No archived payroll yet.' : 'Loading...'

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="card inline-flex gap-1 p-1">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPicked(''); setReview(false) }}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'archived' && archivedList.length > 0 ? (
          <select
            value={shown?.id ?? ''}
            onChange={(e) => setPicked(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--line)' }}
          >
            {archivedList.map((r) => (
              <option key={r.id} value={r.id}>{label(r)} ({r.status})</option>
            ))}
          </select>
              ) : null}

        {shown && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeStyle[shown.status]}`}>
            {shown.status}
          </span>
        )}

                 <div className="ml-auto flex items-center gap-2">
          {tab === 'active' && <CutoffClock cutoff={current.label} />}

                    {isAdmin && shown && shown.status !== 'released' && (
            <button
              className="whitespace-nowrap rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600"
              disabled={busy}
              onClick={() =>
                setAsk({
                  title: 'Delete payroll',
                  message: 'Delete this payroll? Its attendance returns to Active.',
                  onYes: () => act(() => deleteRun(shown.id)),
                })
              }
            >
              Delete
            </button>
          )}

          {tab === 'archived' && shown && slips && slips.length > 0 && (
            <button
              className="whitespace-nowrap rounded-xl border px-5 py-2.5 text-sm font-semibold"
              style={{ borderColor: 'var(--line)' }}
              onClick={() => exportCsv(shown, slips)}
            >
              Export CSV
            </button>
          )}

          {showReview && (
            <>
              <button
                className="whitespace-nowrap rounded-xl border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: 'var(--line)' }}
                onClick={() => setReview(false)}
              >
                Back
              </button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() =>
                  setAsk({
                    title: 'Confirm payroll',
                    message: `Save the payroll for ${current.label} and send it for approval?`,
                    onYes: () => act(() => generateRun(current.start, current.end)),
                  })
                }
              >
                Confirm
              </button>
            </>
          )}

          {shown?.status === 'draft' && isAdmin && (
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                setAsk({
                  title: 'Approve payroll',
                  message: 'Approve this payroll? It will be ready for release.',
                  onYes: () => act(() => approveRun(shown.id)),
                })
              }
            >
              Approve
            </button>
          )}

          {shown?.status === 'approved' && (
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                setAsk({
                  title: 'Release payroll',
                  message: 'Release this payroll? It will move to Archived.',
                  onYes: () => act(() => releaseRun(shown.id)),
                })
              }
            >
              Release
            </button>
          )}

          {showLive && !review && (
            <button className="btn-primary" disabled={busy || rows.length === 0} onClick={() => setReview(true)}>
              Generate Payroll
            </button>
          )}
        </div>
        </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-x-auto">
        {showLive && !review ? (
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
        ) : showReview ? (
          <SummaryTable items={rows.map(fromRow)} empty="No active employees yet." onView={setSlip} />
        ) : (
          <SummaryTable
            items={(slips ?? []).map(fromSlip)}
            empty={emptyMsg}
            status={shown?.status}
            onView={setSlip}
          />
        )}
      </div>

      {ask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-extrabold">{ask.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{ask.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
                style={{ borderColor: 'var(--line)' }}
                onClick={() => setAsk(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => { const fn = ask.onYes; setAsk(null); fn() }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {slip && shown && (
        <PayslipModal
          slip={slip}
          periodStart={shown.periodStart}
          periodEnd={shown.periodEnd}
          onClose={() => setSlip(null)}
        />
      )}
    </>
  )
}