import { useEffect, useSyncExternalStore } from 'react'
import { api } from './api'

type Row = { id: string } & Record<string, unknown>

const EMPTY: Row[] = []
const rows = new Map<string, Row[]>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export async function refreshBenefits(resource: string) {
  rows.set(resource, await api<Row[]>(`/benefits/${resource}`))
  emit()
}

export function useBenefits<T extends { id: string }>(resource: string) {
  useEffect(() => {
    refreshBenefits(resource).catch(console.error)
  }, [resource])
  return useSyncExternalStore(subscribe, () => rows.get(resource) ?? EMPTY) as unknown as T[]
}

export async function saveBenefit(resource: string, id: string | null, body: object) {
  const saved = await api<Row>(id ? `/benefits/${resource}/${id}` : `/benefits/${resource}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  })
  const list = rows.get(resource) ?? []
  rows.set(resource, id ? list.map((r) => (r.id === id ? saved : r)) : [saved, ...list])
  emit()
}

export async function removeBenefit(resource: string, id: string) {
  await api(`/benefits/${resource}/${id}`, { method: 'DELETE' })
  rows.set(resource, (rows.get(resource) ?? []).filter((r) => r.id !== id))
  emit()
}