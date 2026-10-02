import { useState, type ReactNode } from 'react'
import { updateSettings, useSettings } from '../lib/settingsStore'

const input =
  'w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b1220]'

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-slate-500">{label}</label>
    {children}
  </div>
)

type NumKey = 'paidHoursPerDay' | 'overtimeMultiplier' | 'workingDaysPerMonth' | 'cutoffDay'

export default function PayrollSettings() {
  const s = useSettings()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const fromStore = () => ({
    shiftStart: s.shiftStart,
    shiftEnd: s.shiftEnd,
    roundingMinutes: s.roundingMinutes,
    paidHoursPerDay: String(s.paidHoursPerDay),
    overtimeMultiplier: String(s.overtimeMultiplier),
    workingDaysPerMonth: String(s.workingDaysPerMonth),
    cutoffDay: String(s.cutoffDay),
  })

  const [d, setD] = useState(fromStore)
  const v = editing ? d : fromStore()

  const startEdit = () => {
    setD(fromStore())
    setEditing(true)
  }

  const save = async () => {
    const nums = {
      paidHoursPerDay: Number(d.paidHoursPerDay),
      overtimeMultiplier: Number(d.overtimeMultiplier),
      workingDaysPerMonth: Number(d.workingDaysPerMonth),
      cutoffDay: Number(d.cutoffDay),
    }
    if (Object.values(nums).some((n) => !(n > 0)) || !d.shiftStart || !d.shiftEnd) {
      alert('Please enter valid values.')
      return
    }
    setSaving(true)
    try {
      await updateSettings({
        shiftStart: d.shiftStart,
        shiftEnd: d.shiftEnd,
        roundingMinutes: d.roundingMinutes,
        ...nums,
      })
      setEditing(false)
    } catch {
      alert('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const num = (key: NumKey, step: string) => (
    <input
      className={input}
      type="number"
      min="0"
      step={step}
      disabled={!editing}
      value={v[key]}
      onChange={(e) => setD({ ...d, [key]: e.target.value })}
    />
  )

  const btn = 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50'

  return (
    <>
      <div className="mb-3 flex justify-end gap-2">
        {editing ? (
          <>
            <button className={`${btn} border border-slate-300 dark:border-slate-600`} disabled={saving} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className={`${btn} bg-[var(--brand)] text-white`} disabled={saving} onClick={save}>
              Save
            </button>
          </>
        ) : (
          <button className={`${btn} bg-[var(--brand)] text-white`} onClick={startEdit}>
            Edit
          </button>
        )}
      </div>

      <div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 dark:border-slate-700 dark:bg-[#131c2e]">
        <Field label="Shift start">
          <input className={input} type="time" disabled={!editing} value={v.shiftStart} onChange={(e) => setD({ ...d, shiftStart: e.target.value })} />
        </Field>
        <Field label="Shift end">
          <input className={input} type="time" disabled={!editing} value={v.shiftEnd} onChange={(e) => setD({ ...d, shiftEnd: e.target.value })} />
        </Field>
        <Field label="Paid hours per day">{num('paidHoursPerDay', '0.5')}</Field>
        <Field label="Overtime multiplier">{num('overtimeMultiplier', '0.01')}</Field>
        <Field label="Late / undertime / overtime rounding">
          <select
            className={input}
            disabled={!editing}
            value={v.roundingMinutes}
            onChange={(e) => setD({ ...d, roundingMinutes: Number(e.target.value) })}
          >
            <option value={60}>Round up to the hour</option>
            <option value={30}>Round up to 30 min</option>
            <option value={15}>Round up to 15 min</option>
            <option value={1}>Exact minute</option>
          </select>
        </Field>
        <Field label="Working days per month">{num('workingDaysPerMonth', '1')}</Field>
        <Field label="Cutoff day">{num('cutoffDay', '1')}</Field>
      </div>
    </>
  )
}