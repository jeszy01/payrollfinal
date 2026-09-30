import { useSyncExternalStore } from 'react'
import { api } from './api'
import type { AttendanceRecord } from './payroll'

// The API returns null for empty fields; the app uses undefined.
type ApiRecord = Omit<AttendanceRecord, 'timeIn' | 'timeOut' | 'dailyRate' | 'rules'> & {
  timeIn: string | null
  timeOut: string | null
  dailyRate: number | null
  rules: AttendanceRecord['rules'] | null
}

const normalize = (r: ApiRecord): AttendanceRecord => ({
  ...r,
  timeIn: r.timeIn ?? undefined,
  timeOut: r.timeOut ?? undefined,
  dailyRate: r.dailyRate ?? undefined,
  rules: r.rules ?? undefined,
})

let records: AttendanceRecord[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const refreshAttendance = async () => {
  records = (await api<ApiRecord[]>('/attendance')).map(normalize)
  emit()
}

// Initial load when the app opens
refreshAttendance().catch(console.error)

export const useAttendanceRecords = () => useSyncExternalStore(subscribe, () => records)

/** Insert or update a record (one per employee per day). The server saves the rate and rules snapshot. */
export async function applyRecord(
  patch: Pick<AttendanceRecord, 'employeeId' | 'employeeName' | 'date'> & Partial<AttendanceRecord>
) {
  const saved = normalize(
    await api<ApiRecord>('/attendance', {
      method: 'PUT',
      body: JSON.stringify({
        employeeId: patch.employeeId,
        date: patch.date,
        timeIn: patch.timeIn,
        timeOut: patch.timeOut,
        absent: patch.absent,
        archived: patch.archived,
      }),
    })
  )

  records = records.some((r) => r.employeeId === saved.employeeId && r.date === saved.date)
    ? records.map((r) => (r.employeeId === saved.employeeId && r.date === saved.date ? saved : r))
    : [...records, saved]
  emit()
  return saved
}

// Demo only: clears the local list, it does not delete anything in the database.
export const resetRecords = () => {
  records = []
  emit()
}