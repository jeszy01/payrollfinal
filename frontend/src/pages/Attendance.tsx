import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useEmployees } from '../lib/employeeStore'
import { nowHHmm, todayStr } from '../lib/payroll'
import { useAttendance } from '../lib/useAttendance'

const btn =
  'rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'

// Standalone page for the time in / time out demo (no sidebar).
export default function Attendance() {
  const records = useAttendance(2000)
  const employees = useEmployees()
  const [time, setTime] = useState(nowHHmm())
  const [busy, setBusy] = useState(false)
  const date = todayStr()

   const send = async (employeeId: string, body: Record<string, unknown>) => {
    setBusy(true)
    try {
      try {
        await api('/attendance', { method: 'PUT', body: JSON.stringify({ employeeId, date, ...body }) })
      } catch (e) {
        if (!(e instanceof Error) || !e.message.includes('OT reason is required')) throw e
        const reason = window.prompt('OT reason:')?.trim()
        if (!reason) return
        await api('/attendance', {
          method: 'PUT',
          body: JSON.stringify({ employeeId, date, ...body, otReason: reason }),
        })
      }
      window.dispatchEvent(new Event('attendance-changed'))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen p-7" style={{ background: 'var(--bg-page)', color: 'var(--ink)' }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-start justify-between">
                   <div className="flex items-center gap-3">
            <img src="/archon-nell-icon.png" alt="Archon Nell" className="size-12 object-contain" />
            <div>
              <h1 className="pg-title">Attendance (Demo)</h1>
              <p className="pg-sub">Employee time in / time out</p>
            </div>
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
                  disabled={busy || !!rec}
                  onClick={() => send(emp.id, { timeIn: time })}
                >
                  Time in
                </button>
                <button
                  className={`${btn} bg-emerald-600`}
                  disabled={busy || !rec?.timeIn || !!rec.timeOut}
                  onClick={() => send(emp.id, { timeOut: time })}
                >
                  Time out
                </button>
                <button
                  className={`${btn} bg-slate-500`}
                  disabled={busy || !!rec}
                  onClick={() => send(emp.id, { absent: true })}
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