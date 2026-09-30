import type { ReactNode } from 'react'
import { updateSettings, useSettings } from '../lib/settingsStore'

const input =
  'w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0b1220]'

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-slate-500">{label}</label>
    {children}
  </div>
)

export default function PayrollSettings() {
  const s = useSettings()

  // Numbers: nagse-save pag umalis sa field (onBlur) at kung valid lang.
  const num = (key: 'paidHoursPerDay' | 'overtimeMultiplier', step: string) => (
    <input
      key={s[key]}
      className={input}
      type="number"
      min="0"
      step={step}
      defaultValue={s[key]}
      onBlur={(e) => {
        const v = Number(e.target.value)
        if (v > 0 && v !== s[key]) updateSettings({ [key]: v })
      }}
    />
  )

  return (
    <>
      <div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 dark:border-slate-700 dark:bg-[#131c2e]">
        <Field label="Shift start">
          <input className={input} type="time" value={s.shiftStart} onChange={(e) => updateSettings({ shiftStart: e.target.value })} />
        </Field>
        <Field label="Shift end">
          <input className={input} type="time" value={s.shiftEnd} onChange={(e) => updateSettings({ shiftEnd: e.target.value })} />
        </Field>
        <Field label="Paid hours per day">{num('paidHoursPerDay', '0.5')}</Field>
        <Field label="Overtime multiplier (hal. 1.25)">{num('overtimeMultiplier', '0.01')}</Field>
        <Field label="Late / undertime / overtime rounding">
          <select
            className={input}
            value={s.roundingMinutes}
            onChange={(e) => updateSettings({ roundingMinutes: Number(e.target.value) })}
          >
            <option value={60}>Round up sa oras</option>
            <option value={30}>Round up sa 30 min</option>
            <option value={15}>Round up sa 15 min</option>
            <option value={1}>Eksaktong minuto</option>
          </select>
        </Field>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Awtomatikong nase-save. Ang pagbabago ay para sa susunod na time in lang; hindi nagbabago ang mga nakaraang araw.
      </p>
    </>
  )
}