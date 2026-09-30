import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Moon, ScrollText, Search, Sun, UserCog } from 'lucide-react'

type Props = { title: string; subtitle: string; dark: boolean; onToggleTheme: () => void }

export default function Header({ title, subtitle, dark, onToggleTheme }: Props) {
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <label className="search">
          <Search size={16} />
          <input placeholder="Search employees, records..." />
        </label>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="divider" />

        <div className="profile" ref={ref}>
          <button className="profile-btn" onClick={() => setMenu((m) => !m)}>
            <div className="avatar dark">A</div>
            <div className="user">
              <strong>Admin</strong>
              <span>Admin</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {menu && (
            <div className="dropdown">
              <div className="dropdown-head">
                <strong>Admin</strong>
                <span>Admin</span>
              </div>
              <Link to="/settings" onClick={() => setMenu(false)}>
                <UserCog size={16} /> User &amp; account settings
              </Link>
              <Link to="/audit-logs" onClick={() => setMenu(false)}>
                <ScrollText size={16} /> Logs &amp; audit
              </Link>
              <button className="danger" onClick={() => alert('Sign out: ikakabit sa Laravel auth sa susunod na step')}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
