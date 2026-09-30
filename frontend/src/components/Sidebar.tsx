import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Banknote, ChevronDown, ChevronsLeft, ChevronsRight, Users } from 'lucide-react'

type Props = { collapsed: boolean; onToggle: () => void }

const subLinks = [
  ['/payroll/runs', 'Payroll Runs'],
  ['/payroll/settings', 'Payroll Settings'],
]

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(pathname.startsWith('/payroll'))
  const inPayroll = pathname.startsWith('/payroll')

  return (
    <aside
      className={`flex flex-col bg-[#1c3aa9] text-white transition-all duration-200 dark:bg-[#101d5c] ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <Link to="/" className="flex items-center gap-2.5 px-5 py-6">
        {/* Palitan ng totoong logo: ilagay sa public/logo.png at gamitin <img src="/logo.png" /> */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="shrink-0">
          <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#f59e0b" strokeWidth="2" />
          <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#a855f7" strokeWidth="2" transform="rotate(60 20 20)" />
          <ellipse cx="20" cy="20" rx="16" ry="6" stroke="#3b82f6" strokeWidth="2" transform="rotate(120 20 20)" />
          <circle cx="20" cy="20" r="3.5" fill="#22c55e" />
        </svg>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-extrabold text-[#ef1c1c]">ARCHON NELL</span>
            <span className="text-[11px] font-bold">INCORPORATED</span>
          </div>
        )}
      </Link>

      <nav className="flex-1 px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center gap-3 rounded-lg p-3 text-[15px] font-medium hover:bg-[#2f5fe0] ${
            inPayroll ? 'bg-[#2f5fe0]' : ''
          }`}
        >
          <Banknote size={18} />
          {!collapsed && (
            <>
              <span>Payroll</span>
              <ChevronDown size={16} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {open &&
          !collapsed &&
          subLinks.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `ml-6 mt-1.5 block rounded-lg px-3.5 py-2.5 text-sm font-medium hover:bg-[#3b6cf0] hover:text-white ${
                  isActive ? 'bg-[#3b6cf0] text-white' : 'text-[#dbe4ff]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

        <NavLink
          to="/employees"
          className={({ isActive }) =>
            `mt-1.5 flex items-center gap-3 rounded-lg p-3 text-[15px] font-medium hover:bg-[#2f5fe0] ${
              isActive ? 'bg-[#2f5fe0]' : ''
            }`
          }
        >
          <Users size={18} />
          {!collapsed && <span>Employee Data</span>}
        </NavLink>
      </nav>

      <div className={`flex items-center gap-2.5 border-t border-white/15 p-4 ${collapsed ? 'flex-col' : ''}`}>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2f5fe0] font-semibold">A</div>
        {!collapsed && (
          <div className="flex flex-col text-left leading-tight">
            <strong className="text-sm">Admin</strong>
            <span className="text-xs opacity-70">Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className={`grid size-8 place-items-center rounded-lg border border-white/35 ${collapsed ? '' : 'ml-auto'}`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}