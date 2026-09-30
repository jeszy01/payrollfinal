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
      <div className="mb-4 inline-flex rounded-[10px] border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#131c2e]">
        {(['active', 'archived'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? 'bg-slate-900 text-white' : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#131c2e]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="border-b border-slate-200 px-5 py-3.5 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="p-10 text-center text-slate-500">Waiting for attendance data…</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 first:border-t-0 dark:border-slate-700">
                <td className="px-5 py-3.5"><strong>{r.name}</strong></td>
                <td className="px-5 py-3.5">{r.days}</td>
                <td className="px-5 py-3.5">{hrs(r.late)}</td>
                <td className="px-5 py-3.5">{hrs(r.under)}</td>
                <td className="px-5 py-3.5">{hrs(r.over)}</td>
                <td className="px-5 py-3.5">{r.absent || '—'}</td>
                <td className="px-5 py-3.5"><strong>{peso(r.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}