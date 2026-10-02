import { api } from './api'

export type Device = {
  id: number
  device: string
  ip: string | null
  lastUsedAt: string | null
  createdAt: string | null
  current: boolean
}

export const listDevices = () => api<Device[]>('/devices')
export const removeDevice = (id: number) => api<void>(`/devices/${id}`, { method: 'DELETE' })
export const removeOtherDevices = () => api<{ removed: number }>('/devices/others', { method: 'DELETE' })