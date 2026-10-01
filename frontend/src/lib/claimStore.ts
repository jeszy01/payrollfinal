import { useEffect, useSyncExternalStore } from 'react'
import { api } from './api'

export type Claim = {
  id: string
  employeeId: string
  claimTypeId: string | null
  expenseDate: string
  amount: number
  description: string | null
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  rejectReason: string | null
  payrollRunId: string | null
  paidMethod: 'payroll' | 'manual' | null
  paidAt: string | null
  paymentRef: string | null
  hasAttachment: boolean
  attachmentName: string | null
}

export type ClaimInput = {
  employeeId: string
  claimTypeId: string
  expenseDate: string
  amount: number
  description: string | null
  attachmentName?: string
  attachmentMime?: string
  attachmentData?: string
}

let claims: Claim[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const swap = (c: Claim) => {
  claims = claims.map((x) => (x.id === c.id ? c : x))
  emit()
}

export const refreshClaims = async () => {
  claims = await api<Claim[]>('/claims')
  emit()
}

export function useClaims() {
  useEffect(() => {
    refreshClaims().catch(console.error)
  }, [])
  return useSyncExternalStore(subscribe, () => claims)
}

export async function addClaim(input: ClaimInput) {
  const created = await api<Claim>('/claims', { method: 'POST', body: JSON.stringify(input) })
  claims = [created, ...claims]
  emit()
}

export const approveClaim = async (id: string) => swap(await api<Claim>(`/claims/${id}/approve`, { method: 'POST' }))

export const rejectClaim = async (id: string, reason: string) =>
  swap(await api<Claim>(`/claims/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }))

export const payClaim = async (id: string, paidAt: string, paymentRef: string) =>
  swap(await api<Claim>(`/claims/${id}/paid`, { method: 'POST', body: JSON.stringify({ paidAt, paymentRef: paymentRef || null }) }))

export async function removeClaim(id: string) {
  await api(`/claims/${id}`, { method: 'DELETE' })
  claims = claims.filter((c) => c.id !== id)
  emit()
}

export const getAttachment = (id: string) => api<{ name: string; mime: string; data: string }>(`/claims/${id}/attachment`)
