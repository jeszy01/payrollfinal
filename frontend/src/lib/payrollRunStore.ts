import { api } from './api'


export type RunStatus = 'draft' | 'approved' | 'released'

export type PayslipRow = {
  id: string
  employeeId: string
  employeeName: string
  daysWorked: number
  lateMinutes: number
  undertimeMinutes: number
  overtimeMinutes: number
  absences: number
  gross: number
  deduction: number
  overtimePay: number
  sss: number
  pagIbig: number
  claims: number
  employeeNo: string | null
  slCashConversion: number
  philhealth: number
  cashAdvance: number
  sssLoan: number
  hdmfLoan: number
  transportAllowance: number
  riceAllowance: number
  netPay: number
  sentAt: string | null
}

export type PayrollRun = {
  id: string
  periodStart: string
  periodEnd: string
  status: RunStatus
  payslips: PayslipRow[] | null
}

export const listRuns = () => api<PayrollRun[]>('/payroll-runs')
export const getRun = (id: string) => api<PayrollRun>(`/payroll-runs/${id}`)
export const generateRun = (periodStart: string, periodEnd: string) =>
  api<PayrollRun>('/payroll-runs', { method: 'POST', body: JSON.stringify({ periodStart, periodEnd }) })
export const approveRun = (id: string) => api<PayrollRun>(`/payroll-runs/${id}/approve`, { method: 'POST' })
export const releaseRun = (id: string) => api<PayrollRun>(`/payroll-runs/${id}/release`, { method: 'POST' })
export const deleteRun = (id: string) => api<void>(`/payroll-runs/${id}`, { method: 'DELETE' })