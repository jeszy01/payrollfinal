import { api } from './api'
import type { Role } from './auth'

export type AppUser = { id: number; name: string; email: string; role: Role; createdAt: string }
export type UserInput = { name: string; email: string; role: Role; password?: string }

export const listUsers = () => api<AppUser[]>('/users')

export const createUser = (input: UserInput) =>
  api<AppUser>('/users', { method: 'POST', body: JSON.stringify(input) })

export const updateUser = (id: number, input: Partial<UserInput>) =>
  api<AppUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(input) })

export const deleteUser = (id: number) => api<void>(`/users/${id}`, { method: 'DELETE' })