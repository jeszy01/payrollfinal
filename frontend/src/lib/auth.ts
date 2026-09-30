import { api } from './api'

export const isLoggedIn = () => !!localStorage.getItem('token')

export async function login(email: string, password: string) {
  const res = await api<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('token', res.token)
}

export async function logout() {
  try {
    await api<void>('/logout', { method: 'POST' })
  } catch {
    /* token may already be invalid */
  }
  localStorage.removeItem('token')
}