import { useEffect, useRef, useState } from 'react'
import { Activity, Bell, ChevronDown, LogOut, Menu, Moon, ScrollText, Search, Sun, UserCog } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { currentUser, logout } from '../lib/auth'

type Props = { dark: boolean; onToggleTheme: () => void; onMenu: () => void }

const menuItem =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/10'

export default function Header({ dark, onToggleTheme, onMenu }: Props) {
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const me = currentUser()
  const name = me?.name ?? 'User'
  const role = me?.role === 'hr' ? 'HR Staff' : 'Admin'

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="hd">
                  <button className="hd-icon md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={18} />
      </button>
      <Link to="/notifications" className="hd-icon" aria-label="Notifications">
        <Bell size={18} />
      </Link>
      <label className="hd-search">
        <Search size={17} />
        <input
          className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]"
          placeholder="Search employees, records..."
        />
      </label>

      <div className="flex items-center gap-3">
        <button className="hd-icon" onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={ref}>
          <button className="hd-admin" onClick={() => setMenu((m) => !m)}>
            <div className="grid size-10 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
              {name[0]?.toUpperCase()}
            </div>
           <div className="hidden flex-col text-left leading-tight sm:flex">
              <strong className="text-sm">{name}</strong>
              <span className="text-xs text-[var(--muted)]">{role}</span>
            </div>
            <ChevronDown size={16} className="text-[var(--muted)]" />
          </button>

          {menu && (
            <div className="card absolute right-0 top-[calc(100%+8px)] z-50 w-64 p-2">
              <div className="flex flex-col border-b px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
                <strong className="text-sm">{name}</strong>
                <span className="text-xs text-[var(--muted)]">{role}</span>
              </div>
              {me?.role === 'admin' && (
                <Link to="/settings" className={menuItem} onClick={() => setMenu(false)}>
                  <UserCog size={16} /> User &amp; account settings
                </Link>
              )}
              <Link to="/audit-logs" className={menuItem} onClick={() => setMenu(false)}>
                <ScrollText size={16} /> Logs &amp; audit
              </Link>
                            {me?.role === 'admin' && (
                <Link to="/activity-logs" className={menuItem} onClick={() => setMenu(false)}>
                  <Activity size={16} /> Activity Logs
                </Link>
              )}
              <button
                className={`${menuItem} text-red-500`}
                onClick={async () => {
                  await logout()
                  navigate('/login', { replace: true })
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}