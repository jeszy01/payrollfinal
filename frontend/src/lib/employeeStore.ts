import { useSyncExternalStore } from 'react'
import { api } from './api'

export type Employee = {
  id: string
  employeeNo: string
  name: string
  email: string | null
  phone: string | null
  positionId: string
  position: string
  department: string
  salaryGrade: string
  baseSalary: number
  dailyRate: number
  status: string
  employmentType: string
  civilStatus: string | null
  dateHired: string // YYYY-MM-DD
}

export type Position = {
  id: string
  name: string
  department: string
  salaryGrade: string
  monthlySalary: number
}

export type EmployeeInput = {
  name: string
  email?: string | null
  phone?: string | null
  positionId: string
  status?: string
  employmentType?: string
  civilStatus?: string | null
  dateHired: string
}

let employees: Employee[] = []
let positions: Position[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const refreshEmployees = async () => {
  employees = await api<Employee[]>('/employees')
  emit()
}

export const refreshPositions = async () => {
  positions = await api<Position[]>('/positions')
  emit()
}

// Unang load pagbukas ng app
refreshEmployees().catch(console.error)
refreshPositions().catch(console.error)

export const useEmployees = () => useSyncExternalStore(subscribe, () => employees)
export const usePositions = () => useSyncExternalStore(subscribe, () => positions)

export async function addEmployee(input: EmployeeInput) {
  const created = await api<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  employees = [...employees, created]
  emit()
  return created
}

export async function updateEmployee(id: string, patch: Partial<EmployeeInput>) {
  const updated = await api<Employee>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  employees = employees.map((e) => (e.id === id ? updated : e))
  emit()
  return updated
}

export async function removeEmployee(id: string) {
  await api<void>(`/employees/${id}`, { method: 'DELETE' })
  employees = employees.filter((e) => e.id !== id)
  emit()
}

export type PositionInput = {
  name: string
  department: string
  salaryGrade: string
  monthlySalary: number
}

export async function addPosition(input: PositionInput) {
  const created = await api<Position>('/positions', { method: 'POST', body: JSON.stringify(input) })
  positions = [...positions, created]
  emit()
}

export async function updatePosition(id: string, patch: Partial<PositionInput>) {
  const updated = await api<Position>(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
  positions = positions.map((p) => (p.id === id ? updated : p))
  emit()
  await refreshEmployees() // salaries of employees in this position change
}

export async function removePosition(id: string) {
  await api<void>(`/positions/${id}`, { method: 'DELETE' })
  positions = positions.filter((p) => p.id !== id)
  emit()
}