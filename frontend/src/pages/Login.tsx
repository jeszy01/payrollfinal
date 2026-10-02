import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Landmark, LogIn, Lock, Mail, Receipt, Wallet } from 'lucide-react'
import { isLoggedIn, login, verifyOtp } from '../lib/auth'


const field ='w-full rounded-xl border bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]'
  
  const features = [
  { icon: Wallet, text: 'Automated payroll runs' },
  { icon: Landmark, text: 'SSS, PhilHealth & Pag-IBIG' },
  { icon: Receipt, text: 'Claims & reimbursements' },
]

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
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1" style={{ background: 'var(--bg-page)' }}>
          {/* Left / top banner */}
      <div
        className="flex flex-col justify-between gap-8 p-6 text-white lg:p-12"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, #4a6ee0 0%, transparent 55%), linear-gradient(180deg, #2b4fd0 0%, #1a2f8a 100%)',
        }}
      >
        <span />

       <div className="flex items-center gap-3">
  <div
    className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border border-white/30"
    style={{
      background: 'linear-gradient(180deg, #4766d8 0%, #3350bd 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 4px 10px rgba(0,0,0,.25)',
    }}
  >
    <img
      src="/logo_mark.png"
      alt="Archon Nell Incorporated"
      className="h-[38px] w-[38px] object-contain"
      style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,.35))' }}
    />
  </div>
  <div className="leading-none">
    <h2 className="text-[22px] font-extrabold text-white">Archon Nell</h2>
    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#aab8ee]">
      Incorporated
    </p>
  </div>
</div>

<ul className="mt-16 hidden space-y-6 lg:block">
  {features.map(({ icon: Icon, text }) => (
    <li key={text} className="flex items-center gap-4 text-sm font-semibold">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10">
        <Icon size={18} />
      </span>
      {text}
    </li>
  ))}
</ul>

        <p className="hidden text-xs text-white/50 lg:block">© 2026 Archon Nell Incorporated</p>
      </div>
      {/* Form */}
      <div className="grid place-items-center p-6 lg:p-12">
        <form
          onSubmit={step === 'credentials' ? submitCredentials : submitCode}
          className="w-full max-w-md"
        >
          <h1 className="text-3xl font-extrabold">
            {step === 'credentials' ? 'Welcome back' : 'Verification code'}
          </h1>
          <p className="mb-6 mt-2 text-sm text-[var(--muted)]">
            {step === 'credentials' ? 'Sign in to continue.' : `Sent to ${email}`}
          </p>

          {step === 'credentials' ? (
            <div>
              <label className="text-sm font-semibold">Email</label>
              <div className="relative mb-4 mt-1">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="Enter your email"
                  className={`${field} pl-11`}
                  style={{ borderColor: 'var(--line)' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <label className="text-sm font-semibold">Password</label>
              <div className="relative mb-4 mt-1">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className={`${field} pl-11 pr-11`}
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
            <LogIn size={18} />
            {loading ? 'Please wait...' : step === 'credentials' ? 'Sign In' : 'Verify'}
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

          <p className="mt-8 text-center text-xs text-[var(--muted)] lg:hidden">
            © 2026 Archon Nell Incorporated
          </p>
        </form>
      </div>
    </div>
  ) 
  
      }