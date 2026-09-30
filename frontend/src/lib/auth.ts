import { api } from './api'

export type Role = 'admin' | 'hr'
export type User = { name: string; email: string; role: Role }

type Session = { token: string; user: User }

export const isLoggedIn = () => !!localStorage.getItem('token')

export const currentUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const save = ({ token, user }: Session) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

// 'otp' means a code was emailed and must be verified next.
export async function login(email: string, password: string): Promise<'otp' | 'done'> {
  const res = await api<Partial<Session> & { otp_required?: boolean }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (res.otp_required) return 'otp'
  save(res as Session)
  return 'done'
}

export async function verifyOtp(email: string, code: string) {
  save(
    await api<Session>('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  )
}

export async function logout() {
  try {
    await api<void>('/logout', { method: 'POST' })
  } catch {
    /* token may already be invalid */
  }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}