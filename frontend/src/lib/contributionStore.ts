import { useSyncExternalStore } from 'react'
import { api } from './api'
import type { Rate } from './contributions'

let rates: Rate[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const refreshRates = async () => {
  rates = await api<Rate[]>('/contribution-rates')
  emit()
}

refreshRates().catch(console.error)

export const useRates = () => useSyncExternalStore(subscribe, () => rates)

export async function saveRate(r: Rate) {
  const updated = await api<Rate>(`/contribution-rates/${r.type}`, {
    method: 'PUT',
    body: JSON.stringify({
      employee_rate: r.employeeRate,
      employer_rate: r.employerRate,
      min_base: r.minBase,
      max_base: r.maxBase,
      step: r.step,
    }),
  })
  rates = rates.map((x) => (x.type === updated.type ? updated : x))
  emit()
}