import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isLoggedIn, login } from '../lib/auth'

const field =
  'w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--brand)]'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isLoggedIn()) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="grid min-h-screen place-items-center p-4"
      style={{ background: 'linear-gradient(180deg, #2b4fd0 0%, #1a2f8a 100%)' }}
    >
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-[var(--muted)]">Archon Nell Incorporated</p>

        <label className="text-xs font-semibold text-[var(--muted)]">Email</label>
        <input
          type="email"
          required
          autoFocus
          className={`${field} mb-4 mt-1`}
          style={{ borderColor: 'var(--line)' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-xs font-semibold text-[var(--muted)]">Password</label>
        <input
          type="password"
          required
          className={`${field} mb-4 mt-1`}
          style={{ borderColor: 'var(--line)' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <button disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}