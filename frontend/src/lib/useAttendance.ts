import { useEffect, useState } from 'react'
import { api } from './api'
import type { AttendanceRecord } from './payroll'


// Real-time gamit ang polling: nire-refresh ang data kada 3 segundo.
// Papalitan ng WebSocket (Reverb) sa susunod.
export function useAttendance(intervalMs = 3000) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await api<AttendanceRecord[]>('/attendance')
        if (alive) setRecords(data)
      } catch {
        /* subukan ulit sa susunod na interval */
      }
    }
    load()
    window.addEventListener('attendance-changed', load)
    const timer = setInterval(load, intervalMs)
    return () => {
    window.removeEventListener('attendance-changed', load)
      alive = false
      clearInterval(timer)
    }
  }, [intervalMs])

  return records
}