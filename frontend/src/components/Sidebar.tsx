import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Banknote, ChevronDown, ChevronsLeft, ChevronsRight,HeartPulse, Receipt, TrendingUp, Users } from 'lucide-react'
import { currentUser } from '../lib/auth'

type Props = { collapsed: boolean; onToggle: () => void }

const groups = [
  {
    key: 'payroll',
    label: 'Payroll',
    icon: Banknote,
    base: '/payroll',
    links: [
      ['/payroll/runs', 'Payroll Runs'],
      ['/payroll/settings', 'Payroll Settings'],
    ],
  },
  {
    key: 'compensation',
    label: 'Compensation',
    icon: TrendingUp,
    base: '/compensation',
    links: [
      ['/compensation/grades', 'Salary Grades'],
          ['/compensation/adjustments', 'Adjustment Requests'],
    ],
  },
  {
    key: 'benefits',
    label: 'HMO & Benefits',
    icon: HeartPulse,
    base: '/benefits',
    links: [
      ['/benefits/government', 'Government Contributions'],
      ['/benefits/hmo', 'HMO Plans'],
      ['/benefits/company', 'Company Benefits'],
      ['/benefits/enrollments', 'Enrollments'],
          ['/benefits/loans', 'Loans & Advances'],
    ],
  },
  {
    key: 'claims',
    label: 'Claims & Reimbursement',
    icon: Receipt,
    base: '/claims',
    links: [
      ['/claims', 'Claims'],
      ['/claims/types', 'Claim Types'],
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, pathname.startsWith(g.base)]))
  )
  const me = currentUser()
  const name = me?.name ?? 'User'
  const role = me?.role === 'admin' ? 'Admin' : 'HR Staff'

  return (
    <aside
      className={`flex shrink-0 flex-col text-white transition-all duration-200 ${
        collapsed ? 'w-[76px]' : 'w-[274px]'
      }`}
      style={{ background: 'linear-gradient(180deg, #2b4fd0 0%, #1a2f8a 100%)' }}
    >
      <Link to="/" className="flex items-center gap-3 px-5 py-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-md">
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
            <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#f59e0b" strokeWidth="2" />
            <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#a855f7" strokeWidth="2" transform="rotate(60 20 20)" />
            <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#3b82f6" strokeWidth="2" transform="rotate(120 20 20)" />
            <circle cx="20" cy="20" r="3.5" fill="#22c55e" />
          </svg>
        </span>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold text-white">Archon Nell</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Incorporated</span>
          </div>
        )}
      </Link>

     <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <NavLink
          to="/employees"
          className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 ${
              isActive ? 'bg-white/15 text-white' : 'text-white/85'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Users size={20} />
          {!collapsed && <span>Employee Data</span>}
        </NavLink>

        {groups.map((g) => {
          const Icon = g.icon
          const active = pathname.startsWith(g.base)
          const isOpen = open[g.key]
          return (
            <div key={g.key}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/10 ${
                  active ? 'bg-white/15 text-white' : 'text-white/85'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={20} />
                {!collapsed && (
                  <>
                                       <span className="whitespace-nowrap">{g.label}</span>
                    <ChevronDown size={14} className={`ml-auto shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {isOpen &&
                !collapsed &&
                g.links.map(([to, label]) => (
                  <NavLink
                    key={to}
                    to={to}
                    end
                    className={({ isActive }) =>
                                          `mt-0.5 flex items-center gap-2.5 rounded-xl px-4 py-1.5 text-[13px] font-medium transition hover:bg-white/10 ${
                        isActive ? 'bg-white/15 text-white' : 'text-white/75'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`size-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-white/50'}`} />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          )
        })}
      </nav>

      <div
        className={`m-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 ${
          collapsed ? 'flex-col' : ''
        }`}
      >
<div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4a7bff] to-[#2b4fd0] font-bold">
  {name.charAt(0).toUpperCase()}
</div>
{!collapsed && (
  <div className="flex min-w-0 flex-col text-left leading-tight">
    <strong className="truncate text-sm">{name}</strong>
    <span className="text-xs text-white/65">{role}</span>
  </div>
)}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className={`grid size-8 place-items-center rounded-lg border border-white/30 hover:bg-white/10 ${
            collapsed ? '' : 'ml-auto'
          }`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}