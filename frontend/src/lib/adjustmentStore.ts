import { useSyncExternalStore } from 'react'
import { api } from './api'
import { refreshEmployees, refreshPositions } from './employeeStore'

export type Adjustment = {
  id: string
  type: 'promotion' | 'market'
  employeeId: string | null
  positionId: string | null
  newPositionId: string | null
  oldSalary: number
  newSalary: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  decidedAt: string | null
  createdAt: string | null
}

export type AdjustmentInput = {
  type: 'promotion' | 'market'
  employeeId?: string
  newPositionId?: string
  positionId?: string
  newSalary?: number
  reason?: string
}

let adjustments: Adjustment[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const refreshAdjustments = async () => {
  adjustments = await api<Adjustment[]>('/adjustments')
  emit()
}

refreshAdjustments().catch(console.error)

export const useAdjustments = () => useSyncExternalStore(subscribe, () => adjustments)

export async function addAdjustment(input: AdjustmentInput) {
  const created = await api<Adjustment>('/adjustments', { method: 'POST', body: JSON.stringify(input) })
  adjustments = [created, ...adjustments]
  emit()
}

export async function decideAdjustment(id: string, action: 'approve' | 'reject') {
  const updated = await api<Adjustment>(`/adjustments/${id}/${action}`, { method: 'POST' })
  adjustments = adjustments.map((a) => (a.id === id ? updated : a))
  emit()
  if (action === 'approve') await Promise.all([refreshEmployees(), refreshPositions()])
}