import { useSyncExternalStore } from 'react'
import { api } from './api'

export type PayrollSettings = {
  shiftStart: string // HH:mm
  shiftEnd: string // HH:mm
  paidHoursPerDay: number
  overtimeMultiplier: number
  roundingMinutes: number // 60 = round up to the hour, 1 = exact minutes
  otThresholdMinutes: number
  workingDaysPerMonth: number
  cutoffDay: number
}

// Fallback values used until the API responds.
export const DEFAULT_SETTINGS: PayrollSettings = {
  shiftStart: '08:00',
  shiftEnd: '17:00',
  paidHoursPerDay: 8,
  overtimeMultiplier: 1.25,
  roundingMinutes: 60,
  otThresholdMinutes: 5,
  workingDaysPerMonth: 22,
  cutoffDay: 15,
}

let settings: PayrollSettings = DEFAULT_SETTINGS
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const refreshSettings = async () => {
  settings = { ...DEFAULT_SETTINGS, ...(await api<PayrollSettings>('/settings')) }
  emit()
}

// Initial load when the app opens
refreshSettings().catch(console.error)

export const useSettings = () => useSyncExternalStore(subscribe, () => settings)

// Updates the screen immediately, then saves to the API.
// If the API rejects the change, the previous values are restored.
export async function updateSettings(patch: Partial<PayrollSettings>) {
  const previous = settings
  settings = { ...settings, ...patch }
  emit()

  try {
    const saved = await api<PayrollSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(patch),
    })
    settings = { ...DEFAULT_SETTINGS, ...saved }
  } catch (err) {
    console.error(err)
    settings = previous
    emit()
    throw err
  }
  emit()
}