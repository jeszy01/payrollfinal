import { useState } from 'react'
import { Link } from 'react-router-dom'
import { applyRecord, resetRecords, useAttendanceRecords } from '../lib/attendanceStore'
import { useEmployees } from '../lib/employeeStore'
import { nowHHmm, todayStr } from '../lib/payroll'
import { useSettings } from '../lib/settingsStore'

const btn = 'rounded-lg px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40'

// Hiwalay na page para sa demo ng time in / time out (walang sidebar).
export default function Attendance() {
  const records = useAttendanceRecords()
  const employees = useEmployees()
  const settings = useSettings()
  const [time, setTime] = useState(nowHHmm())
  const date = todayStr()

  return (
    <div className="min-h-screen bg-[#f4f6fa] p-6 font-sans text-slate-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Attendance (Demo)</h1>
            <p className="text-sm text-slate-500">Time in / time out ng mga employee</p>
          </div>
          <Link to="/payroll/runs" className="text-sm font-medium text-[#2f5fe0]">← Payroll Runs</Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-medium">Oras:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button onClick={() => setTime(nowHHmm())} className="text-sm text-[#2f5fe0]">Gamitin ang ngayon</button>
          <button
            onClick={() => confirm('Burahin lahat ng attendance demo data?') && resetRecords()}
            className="ml-auto text-sm text-red-600"
          >
            Reset demo
          </button>
        </div>

        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {employees.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              Wala pang employee. Mag-add muna sa{' '}
              <Link to="/employees" className="text-[#2f5fe0]">Employee Data</Link>.
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
                  : 'Wala pang time in'
            return (
              <div key={emp.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-40 flex-1">
                  <strong className="text-sm">{emp.name}</strong>
                  <p className="text-xs text-slate-500">{status}</p>
                </div>
                <button
                  className={`${btn} bg-[#2f5fe0]`}
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