import { DEFAULT_SETTINGS, type PayrollSettings } from './settingsStore'

export type AttendanceRecord = {
  id: string
  employeeId: string
  employeeName: string
  date: string // YYYY-MM-DD
  dailyRate?: number // daily rate on that day (saved at time in)
  rules?: PayrollSettings // settings on that day (saved at time in)
  timeIn?: string // HH:mm
  timeOut?: string // HH:mm
  absent?: boolean
  archived?: boolean
  payrollRunId?: string | null
  otReason?: string | null
}

export type DayStatus = 'absent' | 'working' | 'final'

export type DayComputation = {
  lateMinutes: number
  undertimeMinutes: number
  overtimeMinutes: number
  absences: number
  deduction: number // late, undertime, absent
  overtimePay: number
  status: DayStatus
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const round2 = (n: number) => Math.round(n * 100) / 100

export function computeDay(r: AttendanceRecord): DayComputation {
  const { shiftStart, shiftEnd, paidHoursPerDay, overtimeMultiplier, roundingMinutes } = r.rules ?? DEFAULT_SETTINGS
  const dailyRate = r.dailyRate ?? 0
  const hourly = dailyRate / paidHoursPerDay

  const roundUp = (mins: number) => {
    const m = Math.max(0, mins)
    return roundingMinutes > 0 ? Math.ceil(m / roundingMinutes) * roundingMinutes : m
  }
  const cost = (mins: number) => (mins / 60) * hourly

  if (r.absent || !r.timeIn) {
    return {
      lateMinutes: 0, undertimeMinutes: 0, overtimeMinutes: 0, absences: 1,
      deduction: round2(dailyRate), overtimePay: 0, status: 'absent',
    }
  }

  const late = roundUp(toMinutes(r.timeIn) - toMinutes(shiftStart))

  // Timed in only: only late is known so far.
  if (!r.timeOut) {
    return {
      lateMinutes: late, undertimeMinutes: 0, overtimeMinutes: 0, absences: 0,
      deduction: round2(Math.min(dailyRate, cost(late))), overtimePay: 0, status: 'working',
    }
  }

  // Timed out: the day is final.
  const under = roundUp(toMinutes(shiftEnd) - toMinutes(r.timeOut))
  const over = roundUp(toMinutes(r.timeOut) - toMinutes(shiftEnd))
  return {
    lateMinutes: late, undertimeMinutes: under, overtimeMinutes: over, absences: 0,
    deduction: round2(Math.min(dailyRate, cost(late + under))),
    overtimePay: round2(cost(over) * overtimeMultiplier),
    status: 'final',
  }
}

export const peso = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const pad = (n: number) => String(n).padStart(2, '0')

export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const nowHHmm = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type Cutoff = { key: string; start: string; end: string; label: string }

// Semi-monthly cutoff. cutoffDay comes from Payroll Settings.
export function cutoffOf(dateStr: string, cutoffDay: number): Cutoff {
  const [y, m, d] = dateStr.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  const first = d <= cutoffDay
  const fromDay = first ? 1 : cutoffDay + 1
  const toDay = first ? cutoffDay : last
  const month = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  return {
    key: `${y}-${pad(m)}-${pad(fromDay)}`,
    start: `${y}-${pad(m)}-${pad(fromDay)}`,
    end: `${y}-${pad(m)}-${pad(toDay)}`,
    label: `${month} ${fromDay}–${toDay}, ${y}`,
  }
}