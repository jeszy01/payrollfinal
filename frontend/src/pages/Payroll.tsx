import { useMemo, useState } from 'react'
import { useAttendanceRecords } from '../lib/attendanceStore'
import { computeDay, peso } from '../lib/payroll'

const columns = ['Employee', 'Days Worked', 'Late', 'Undertime', 'Overtime', 'Absent', 'Total Salary']

// Ginagawang "1 hr 30 min" ang minuto
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
  const records = useAttendanceRecords()

  // Isang row kada employee: naiipon ang lahat ng araw at nag-a-update habang pumapasok ang data.
  const rows = useMemo(() => {
    const map = new Map<string, Row>()
    for (const r of records) {
      if ((tab === 'archived') !== !!r.archived) continue
      const c = computeDay(r)
      const row = map.get(r.employeeId) ?? {
        id: r.employeeId, name: r.employeeName, days: 0, late: 0, under: 0, over: 0, absent: 0, total: 0,
      }
      if (c.status !== 'absent') row.days += 1
      row.late += c.lateMinutes
      row.under += c.undertimeMinutes
      row.over += c.overtimeMinutes
      row.absent += c.absences
      row.total += c.total
      map.set(r.employeeId, row)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [records, tab])

  return (
    <>
      <div className="card mb-5 inline-flex gap-1 p-1">
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
                  Waiting for attendance data…
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