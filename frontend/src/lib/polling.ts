 import { refreshEmployees, refreshPositions } from './employeeStore'
import { refreshAttendance } from './attendanceStore'
import { refreshAdjustments } from './adjustmentStore'

const INTERVAL_MS = 5000

export function startPolling() {
  const tick = () => {
    if (document.hidden) return // pause while the tab is in the background
    Promise.all([
      refreshEmployees(),
      refreshPositions(),
      refreshAttendance(),
      refreshAdjustments(),
    ]).catch(() => {}) // ignore network errors, retry on the next tick
  }

  const id = setInterval(tick, INTERVAL_MS)
  document.addEventListener('visibilitychange', tick) // refresh right away when the tab is reopened
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', tick)
  }
}