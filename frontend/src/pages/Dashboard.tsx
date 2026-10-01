import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, FilePlus, HeartPulse, Receipt, RefreshCw, Search, ShieldPlus, TrendingUp, UserPlus, Users,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { peso } from '../lib/payroll'

type Item = { label: string; value: number }
type Data = {
  employees: { active: number; total: number; byDepartment: Item[] }
  payroll: {
    latest: { label: string; status: string; gross: number; net: number; deductions: number } | null
    history: { label: string; gross: number; net: number }[]
    deductions: Item[]
    draft: number
    approved: number
  }
  claims: Record<'pending' | 'approved' | 'rejected' | 'paid', { count: number; amount: number }>
  adjustmentsPending: number
  hmo: { enrolled: number }
}

const COLORS = ['#2f5fe0', '#7c5ac9', '#2b6a86', '#c97b5a', '#2f9e6f', '#c9a13a']
const pct = (v: number, t: number) => (t > 0 ? `${((v / t) * 100).toFixed(1)}%` : '0%')
const sum = (items: Item[]) => items.reduce((s, i) => s + i.value, 0)

function Kpi({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string; sub: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="truncate text-2xl font-extrabold">{value}</p>
        <p className="truncate text-xs text-[var(--muted)]">{sub}</p>
      </div>
    </div>
  )
}

function Donut({ items }: { items: Item[] }) {
  const total = sum(items)
  const r = 70
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--line)" strokeWidth="28" />
          {items.map((i, idx) => {
            const len = (i.value / total) * c
            const el = (
              <circle
                key={i.label}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth="28"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xs text-[var(--muted)]">Total</div>
            <div className="text-sm font-extrabold">{peso(total)}</div>
          </div>
        </div>
      </div>
      <ul className="grid min-w-52 flex-1 gap-2 text-sm">
        {items.map((i, idx) => (
          <li key={i.label} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
            <span className="flex-1">{i.label}</span>
            <span className="text-[var(--muted)]">{peso(i.value)}</span>
            <span className="w-14 text-right font-bold">{pct(i.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PayrollBars({ history }: { history: Data['payroll']['history'] }) {
  const max = Math.max(...history.flatMap((h) => [h.gross, h.net]), 1)
  return (
    <div className="flex h-52 items-end gap-4">
      {history.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-44 w-full items-end justify-center gap-1">
            <div className="w-2/5 rounded-t-md bg-[#c9d6fb]" style={{ height: `${(h.gross / max) * 100}%` }} title={`Gross ${peso(h.gross)}`} />
            <div className="w-2/5 rounded-t-md bg-[var(--brand)]" style={{ height: `${(h.net / max) * 100}%` }} title={`Net ${peso(h.net)}`} />
          </div>
          <span className="whitespace-nowrap text-xs text-[var(--muted)]">{h.label}</span>
        </div>
      ))}
    </div>
  )
}

function Bars({ items }: { items: Item[] }) {
  const total = sum(items)
  return (
    <div className="grid gap-4">
      {items.map((i, idx) => (
        <div key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{i.label}</span>
            <span className="font-semibold">{i.value} · {pct(i.value, total)}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--line)]">
            <div
              className="h-2 rounded-full"
              style={{ width: total ? `${(i.value / total) * 100}%` : '0%', background: COLORS[idx % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const ACTIONS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/payroll/runs', label: 'Run New Payroll', icon: RefreshCw },
  { to: '/employees', label: 'Add Employee', icon: UserPlus },
  { to: '/claims', label: 'Submit Claim', icon: FilePlus },
  { to: '/benefits/enrollments', label: 'Enroll HMO', icon: ShieldPlus },
  { to: '/compensation/adjustments', label: 'Salary Adjustment', icon: TrendingUp },
  { to: '/employees', label: 'Employee Directory', icon: Search },
]

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const load = () =>
      api<Data>('/dashboard')
        .then((d) => { if (alive) { setData(d); setError('') } })
        .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Failed to load the dashboard.') })
    load()
    const timer = setInterval(load, 5000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  if (!data) {
    return error
      ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      : <p className="text-[var(--muted)]">Loading...</p>
  }

  const { employees, payroll, claims } = data
  const deductions = payroll.deductions.filter((d) => d.value > 0)
  const hist = payroll.history
  const change =
    hist.length >= 2 && hist[hist.length - 2].net > 0
      ? ((hist[hist.length - 1].net - hist[hist.length - 2].net) / hist[hist.length - 2].net) * 100
      : null
  const hmoRate = employees.active ? Math.min(100, Math.round((data.hmo.enrolled / employees.active) * 100)) : 0
  const card = 'card p-6'

  const pending = [
    { icon: Receipt, tone: 'bg-orange-50 text-orange-600', title: 'Claims', text: `${claims.pending.count} pending reimbursement requests`, to: '/claims', cta: 'Review' },
    { icon: TrendingUp, tone: 'bg-blue-50 text-blue-600', title: 'Salary Adjustments', text: `${data.adjustmentsPending} compensation changes pending`, to: '/compensation/adjustments', cta: 'Review' },
    { icon: Banknote, tone: 'bg-emerald-50 text-emerald-600', title: 'Payroll', text: `${payroll.draft} awaiting approval · ${payroll.approved} awaiting release`, to: '/payroll/runs', cta: 'Review' },
    { icon: HeartPulse, tone: 'bg-slate-100 text-slate-600', title: 'HMO Members', text: `${data.hmo.enrolled} active members to monitor`, to: '/benefits/enrollments', cta: 'View' },
  ]

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Active Employees" value={String(employees.active)} sub={`of ${employees.total} total`} />
        <Kpi
          icon={Banknote}
          label="Latest Net Pay"
          value={payroll.latest ? peso(payroll.latest.net) : '—'}
          sub={payroll.latest ? `${payroll.latest.label} · ${payroll.latest.status}` : 'No payroll yet'}
        />
        <Kpi icon={Receipt} label="Pending Claims" value={String(claims.pending.count)} sub={`${peso(claims.pending.amount)} total`} />
        <Kpi icon={HeartPulse} label="HMO Enrolled" value={`${hmoRate}%`} sub={`${data.hmo.enrolled} of ${employees.active} employees`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="text-lg font-bold">Deductions Breakdown</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">{payroll.latest ? payroll.latest.label : ''}</p>
          {deductions.length > 0 ? <Donut items={deductions} /> : <p className="py-10 text-center text-[var(--muted)]">No payroll yet.</p>}
        </div>

        <div className={card}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Payroll by Period</h2>
              <p className="flex gap-4 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[#c9d6fb]" />Gross</span>
                <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--brand)]" />Net</span>
              </p>
            </div>
            {change !== null && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            )}
          </div>
          {hist.length > 0 ? <PayrollBars history={hist} /> : <p className="py-10 text-center text-[var(--muted)]">No payroll yet.</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="text-lg font-bold">Quick Actions</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">Common tasks</p>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-slate-50 px-3 py-5 text-sm font-bold transition hover:bg-slate-100 dark:bg-transparent"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Icon size={20} className="text-[var(--brand)]" />
                  {a.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-lg font-bold">Pending Approvals</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">Items needing your attention</p>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {pending.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="flex items-center gap-4 py-4">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${p.tone}`}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{p.title}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{p.text}</p>
                  </div>
                  <Link to={p.to} className="rounded-lg bg-blue-50 px-4 py-1.5 text-sm font-semibold text-[var(--brand)]">
                    {p.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h2 className="mb-5 text-lg font-bold">Claims by Status</h2>
          <Bars items={[
            { label: 'Pending', value: claims.pending.count },
            { label: 'Approved', value: claims.approved.count },
            { label: 'Rejected', value: claims.rejected.count },
            { label: 'Paid', value: claims.paid.count },
          ]} />
        </div>
        <div className={card}>
          <h2 className="mb-5 text-lg font-bold">Employees by Department</h2>
          {employees.byDepartment.length > 0
            ? <Bars items={employees.byDepartment} />
            : <p className="py-10 text-center text-[var(--muted)]">No employees yet.</p>}
        </div>
      </div>
    </div>
  )
}