import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { isLoggedIn, login, verifyOtp } from '../lib/auth'

const field =
  'w-full rounded-xl border bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  if (isLoggedIn()) return <Navigate to="/" replace />

  const run = async (fn: () => Promise<void>) => {
    setLoading(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const submitCredentials = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const result = await login(email.trim(), password)
      if (result === 'done') return navigate('/', { replace: true })
      setCode('')
      setCooldown(60)
      setStep('otp')
    })
  }

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await verifyOtp(email.trim(), code)
      navigate('/', { replace: true })
    })
  }

  const resend = () =>
    run(async () => {
      await login(email.trim(), password)
      setCode('')
      setCooldown(60)
    })

  return (
    <div className="grid min-h-screen lg:grid-cols-2" style={{ background: 'var(--bg-page)' }}>
      <div
        className="hidden flex-col justify-between p-12 text-white lg:flex"
        style={{ background: 'linear-gradient(180deg, #2b4fd0 0%, #1a2f8a 100%)' }}
      >
        <div>
          <p className="text-lg font-extrabold">Archon Nell Incorporated</p>
          <p className="text-sm text-white/70">Payroll &amp; Benefits Management</p>
        </div>
        <p className="text-xs text-white/50">© 2026 Archon Nell Incorporated</p>
      </div>

      <div className="grid place-items-center p-6">
        <form
          onSubmit={step === 'credentials' ? submitCredentials : submitCode}
          className="w-full max-w-sm"
        >
          <h1 className="text-3xl font-extrabold">
            {step === 'credentials' ? 'Sign in' : 'Verification code'}
          </h1>
          {step === 'otp' && (
            <p className="mb-6 mt-2 text-sm text-[var(--muted)]">Sent to {email}</p>
          )}

          {step === 'credentials' ? (
            <div className="mt-6">
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
              <div className="relative mb-4 mt-1">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  className={`${field} pr-11`}
                  style={{ borderColor: 'var(--line)' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ) : (
            <input
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className={`${field} mb-4 text-center text-2xl font-bold tracking-[0.5em]`}
              style={{ borderColor: 'var(--line)' }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          )}

          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={loading || (step === 'otp' && code.length !== 6)}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            <Lock size={16} />
            {loading ? 'Please wait...' : step === 'credentials' ? 'Sign in' : 'Verify'}
          </button>

          {step === 'otp' && (
            <div className="mt-4 flex justify-between text-sm">
              <button
                type="button"
                className="text-[var(--muted)]"
                onClick={() => {
                  setStep('credentials')
                  setError('')
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={resend}
                className="font-semibold text-[var(--brand)] disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}