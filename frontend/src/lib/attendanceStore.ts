import { useSyncExternalStore } from 'react'
import type { AttendanceRecord } from './payroll'

// DEMO: naka-save sa localStorage at nagsi-sync sa ibang tab ng parehong browser.
// Sa Laravel step: papalitan ng API + WebSocket (Reverb).
const KEY = 'attendance-records'

const load = (): AttendanceRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

let records: AttendanceRecord[] = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

// Real-time sync: kapag may nagbago sa ibang tab, mag-update dito.
window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) {
    records = load()
    emit()
  }
})

const commit = (next: AttendanceRecord[]) => {
  records = next
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    /* ignore */
  }
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useAttendanceRecords = () => useSyncExternalStore(subscribe, () => records)

/** Insert o i-update ang record (isa kada employee kada araw). */
export function applyRecord(
  patch: Pick<AttendanceRecord, 'employeeId' | 'employeeName' | 'date'> & Partial<AttendanceRecord>
) {
  const same = (r: AttendanceRecord) => r.employeeId === patch.employeeId && r.date === patch.date
  commit(
    records.some(same)
      ? records.map((r) => (same(r) ? { ...r, ...patch } : r))
      : [...records, { id: `${patch.employeeId}-${patch.date}`, ...patch }]
  )
}

export const resetRecords = () => commit([])