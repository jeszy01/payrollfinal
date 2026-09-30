import { useMemo, useState } from 'react'
import { useEmployees } from '../lib/employeeStore'
import { computeDay, cutoffOf, peso, todayStr } from '../lib/payroll'
import { useSettings } from '../lib/settingsStore'
import { useAttendance } from '../lib/useAttendance'

const columns = ['Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent', 'Total Salary']

// Minutes to "1 hr 30 min"
const hrs = (mins: number) => {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(' ')
}

type Row = {
  id: string
  name: string
  days: number
  late: number
  under: number
  over: number
  absent: number
  total: number
}

export default function Payroll() {
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [picked, setPicked] = useState('')
  const records = useAttendance()
  const employees = useEmployees()
  const { cutoffDay } = useSettings()

  const current = cutoffOf(todayStr(), cutoffDay)

  // Past cutoffs, taken from the attendance records
  const past = useMemo(() => {
    const map = new Map<string, ReturnType<typeof cutoffOf>>()
    for (const r of records) {
      const c = cutoffOf(r.date, cutoffDay)
      if (c.key < current.key) map.set(c.key, c)
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
  }, [records, current.key, cutoffDay])

  const cutoff = tab === 'active' ? current : (past.find((c) => c.key === picked) ?? past[0])

  // One row per employee: (monthly ÷ 2) − deductions + overtime
  const rows = useMemo<Row[]>(() => {
    if (!cutoff) return []
    return employees
      .filter((e) => e.status === 'Active')
      .map((emp) => {
        const row: Row = { id: emp.id, name: emp.name, days: 0, late: 0, under: 0, over: 0, absent: 0, total: 0 }
        let deduction = 0
        let overtimePay = 0
        for (const r of records) {
          if (r.employeeId !== emp.id || r.date < cutoff.start || r.date > cutoff.end) continue
          const c = computeDay(r)
          if (c.status !== 'absent') row.days += 1
          row.late += c.lateMinutes
          row.under += c.undertimeMinutes
          row.over += c.overtimeMinutes
          row.absent += c.absences
          deduction += c.deduction
          overtimePay += c.overtimePay
        }
        row.total = Math.max(0, emp.baseSalary / 2 - deduction) + overtimePay
        return row
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [employees, records, cutoff])

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="card inline-flex gap-1 p-1">
          {(['active', 'archived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'archived' && past.length > 0 ? (
          <select
            value={cutoff?.key}
            onChange={(e) => setPicked(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--line)' }}
          >
            {past.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        ) : (
          cutoff && <span className="text-sm font-semibold text-[var(--muted)]">{cutoff.label}</span>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="!py-12 text-center text-[var(--muted)]">
                  {tab === 'archived' ? 'No past cutoffs yet.' : 'No active employees yet.'}
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
      </div>
    </>
  )
}