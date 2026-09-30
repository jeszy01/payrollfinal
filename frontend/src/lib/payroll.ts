import { DEFAULT_SETTINGS, type PayrollSettings } from './settingsStore'

export type AttendanceRecord = {
  id: string
  employeeId: string
  employeeName: string
  date: string // YYYY-MM-DD
  dailyRate?: number // rate noong araw na iyon (naka-save sa time in)
  rules?: PayrollSettings // settings noong araw na iyon (naka-save sa time in)
  timeIn?: string // HH:mm
  timeOut?: string // HH:mm
  absent?: boolean
  archived?: boolean
}

export type DayStatus = 'absent' | 'working' | 'final'

export type DayComputation = {
  lateMinutes: number
  undertimeMinutes: number
  overtimeMinutes: number
  absences: number
  total: number
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

  // Rounding rule (galing sa settings): 60 = round up sa oras.
  const roundUp = (mins: number) => {
    const m = Math.max(0, mins)
    return roundingMinutes > 0 ? Math.ceil(m / roundingMinutes) * roundingMinutes : m
  }
  const cost = (mins: number) => (mins / 60) * hourly

  if (r.absent || !r.timeIn) {
    return { lateMinutes: 0, undertimeMinutes: 0, overtimeMinutes: 0, absences: 1, total: 0, status: 'absent' }
  }

  const late = roundUp(toMinutes(r.timeIn) - toMinutes(shiftStart))

  // Time in pa lang: provisional (buong araw minus late).
  if (!r.timeOut) {
    return {
      lateMinutes: late, undertimeMinutes: 0, overtimeMinutes: 0, absences: 0,
      total: round2(Math.max(0, dailyRate - cost(late))), status: 'working',
    }
  }

  // May time out: final na ang araw.
  const under = roundUp(toMinutes(shiftEnd) - toMinutes(r.timeOut))
  const over = roundUp(toMinutes(r.timeOut) - toMinutes(shiftEnd))
  const total = Math.max(0, dailyRate - cost(late + under)) + cost(over) * overtimeMultiplier

  return {
    lateMinutes: late, undertimeMinutes: under, overtimeMinutes: over, absences: 0,
    total: round2(total), status: 'final',
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