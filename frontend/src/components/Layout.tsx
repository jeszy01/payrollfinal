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
  '/employees': ['Employee Data', 'Manage employee records'],
'/attendance': ['Attendance', 'Time in and time out'],
'/compensation/grades': ['Salary Grades', 'Define and manage compensation structures across departments.'],
'/compensation/adjustments': ['Adjustment Requests', 'Salary changes and promotions'],
}

// Pangalan ng group sa sidebar, para sa breadcrumb
const groups: Record<string, string> = {
  '/': 'Workspace',
  '/payroll/runs': 'Payroll',
  '/payroll/settings': 'Payroll',
  '/audit-logs': 'Insights',
  '/settings': 'Insights',
  '/employees': 'Workspace',
'/attendance': 'Payroll',
'/compensation/grades': 'Compensation',
'/compensation/adjustments': 'Compensation',
}

export default function Layout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [title, subtitle] = titles[pathname] ?? ['', '']
  const group = groups[pathname]

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header dark={dark} onToggleTheme={() => setDark((d) => !d)} />
        <main className="flex-1 overflow-y-auto">
          <div className="pg">
            {title && (
              <div className="mb-7">
                <div className="crumb">
                  {group && <span>{group}</span>}
                  {group && <span>›</span>}
                  <b>{title}</b>
                </div>
                <h1 className="pg-title">{title}</h1>
                {subtitle && <p className="pg-sub">{subtitle}</p>}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}