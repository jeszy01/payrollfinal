export type Rate = {
  type: 'sss' | 'philhealth' | 'pagibig'
  employeeRate: number
  employerRate: number
  minBase: number
  maxBase: number | null
  step: number | null
}

const round = (n: number) => Math.round(n * 100) / 100

export function computeContribution(monthlySalary: number, r: Rate) {
  let base = Math.max(monthlySalary, r.minBase)
  if (r.maxBase != null) base = Math.min(base, r.maxBase)
  if (r.step) base = Math.round(base / r.step) * r.step
  const employee = round((base * r.employeeRate) / 100)
  const employer = round((base * r.employerRate) / 100)
  return { base, employee, employer, total: round(employee + employer) }
}