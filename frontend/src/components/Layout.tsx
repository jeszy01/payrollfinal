import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, [string, string]> = {
  '/': ['Dashboard', 'Overview'],
  '/payroll/runs': ['Payroll Management', 'Compute payroll and review payslips'],
  '/audit-logs': ['Logs & audit', 'System activity trail'],
  '/settings': ['User & account settings', 'Manage your account'],
  '/payroll/settings': ['Payroll Settings', 'Shift, overtime, and rounding rules'],
}

export default function Layout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [title, subtitle] = titles[pathname] ?? ['', '']

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="app">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="main">
        <Header title={title} subtitle={subtitle} dark={dark} onToggleTheme={() => setDark((d) => !d)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
