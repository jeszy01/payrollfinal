import { useSyncExternalStore } from 'react'

export type Employee = { id: string; name: string; dailyRate: number }

// DEMO: localStorage. Sa Laravel step: papalitan ng API/database.
const KEY = 'employees'

const load = (): Employee[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

let employees: Employee[] = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) {
    employees = load()
    emit()
  }
})

const commit = (next: Employee[]) => {
  employees = next
  try {
    localStorage.setItem(KEY, JSON.stringify(employees))
  } catch {
    /* ignore */
  }
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useEmployees = () => useSyncExternalStore(subscribe, () => employees)

export const addEmployee = (name: string, dailyRate: number) =>
  commit([...employees, { id: crypto.randomUUID(), name, dailyRate }])

export const updateEmployee = (id: string, patch: Partial<Omit<Employee, 'id'>>) =>
  commit(employees.map((e) => (e.id === id ? { ...e, ...patch } : e)))

export const removeEmployee = (id: string) => commit(employees.filter((e) => e.id !== id))