import { useState } from 'react'
import { Link } from 'react-router-dom'
import { applyRecord, resetRecords, useAttendanceRecords } from '../lib/attendanceStore'
import { useEmployees } from '../lib/employeeStore'
import { nowHHmm, todayStr } from '../lib/payroll'
import { useSettings } from '../lib/settingsStore'

const btn =
  'rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'

// Standalone page for the time in / time out demo (no sidebar).
export default function Attendance() {
  const records = useAttendanceRecords()
  const employees = useEmployees()
  const settings = useSettings()
  const [time, setTime] = useState(nowHHmm())
  const date = todayStr()

  return (
    <div className="min-h-screen p-7" style={{ background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="pg-title">Attendance (Demo)</h1>
            <p className="pg-sub">Employee time in / time out</p>
          </div>
          <Link to="/payroll/runs" className="btn-outline">← Payroll Runs</Link>
        </div>

        <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
          <label className="text-sm font-semibold">Time:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--line)' }}
          />
          <button onClick={() => setTime(nowHHmm())} className="text-sm font-semibold text-[var(--brand)]">
            Use current time
          </button>
          <button
            onClick={() => confirm('Delete all attendance demo data?') && resetRecords()}
            className="ml-auto text-sm font-semibold text-red-600"
          >
            Reset demo
          </button>
        </div>

        <div className="card divide-y" style={{ ['--tw-divide-opacity' as string]: 1 }}>
          {employees.length === 0 && (
            <p className="p-8 text-center text-sm text-[var(--muted)]">
              No employees yet. Add one in{' '}
              <Link to="/employees" className="font-semibold text-[var(--brand)]">Employee Data</Link>.
            </p>
          )}
          {employees.map((emp) => {
            const rec = records.find((r) => r.employeeId === emp.id && r.date === date)
            const base = { employeeId: emp.id, employeeName: emp.name, date, dailyRate: emp.dailyRate, rules: settings }
            const status = rec?.absent
              ? 'Absent'
              : rec?.timeOut
                ? `Timed out ${rec.timeOut} (in ${rec.timeIn})`
                : rec?.timeIn
                  ? `Timed in ${rec.timeIn}`
                  : 'No time in yet'
            return (
              <div key={emp.id} className="flex flex-wrap items-center gap-3 p-5" style={{ borderColor: 'var(--line)' }}>
                <div className="min-w-40 flex-1">
                  <strong className="text-[15px]">{emp.name}</strong>
                  <p className="text-xs text-[var(--muted)]">{status}</p>
                </div>
                <button
                  className={`${btn} bg-[var(--brand)]`}
                  disabled={!!rec}
                  onClick={() => applyRecord({ ...base, timeIn: time })}
                >
                  Time in
                </button>
                <button
                  className={`${btn} bg-emerald-600`}
                  disabled={!rec?.timeIn || !!rec.timeOut}
                  onClick={() => applyRecord({ employeeId: emp.id, employeeName: emp.name, date, timeOut: time })}
                >
                  Time out
                </button>
                <button
                  className={`${btn} bg-slate-500`}
                  disabled={!!rec}
                  onClick={() => applyRecord({ ...base, absent: true })}
                >
                  Absent
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}