import { useSyncExternalStore } from 'react'

export type PayrollSettings = {
  shiftStart: string // HH:mm
  shiftEnd: string // HH:mm
  paidHoursPerDay: number
  overtimeMultiplier: number
  roundingMinutes: number // 60 = round up sa oras, 1 = eksaktong minuto
}

// Starting values lang ito. Mababago sa Payroll Settings page.
export const DEFAULT_SETTINGS: PayrollSettings = {
  shiftStart: '08:00',
  shiftEnd: '17:00',
  paidHoursPerDay: 8,
  overtimeMultiplier: 1.25,
  roundingMinutes: 60,
}

// DEMO: localStorage. Sa Laravel step: papalitan ng API/database.
const KEY = 'payroll-settings'

const load = (): PayrollSettings => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

let settings = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) {
    settings = load()
    emit()
  }
})

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useSettings = () => useSyncExternalStore(subscribe, () => settings)

export function updateSettings(patch: Partial<PayrollSettings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
  emit()
}