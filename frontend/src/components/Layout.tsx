import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { startPolling } from '../lib/polling'
import ArcChat from '../components/ArcChat'

const titles: Record<string, [string, string]> = {
  '/': ['Dashboard', 'Overview'],
  '/payroll/runs': ['Payroll Management', 'Compute payroll and review payslips'],
  '/audit-logs': ['Logs & audit', 'System activity trail'],
  '/settings': ['User Management', 'Accounts that can sign in to this system'],
  '/payroll/settings': ['Payroll Settings', 'Shift, overtime, and rounding rules'],
  '/employees': ['Employee Data', 'Manage employee records'],
'/attendance': ['Attendance', 'Time in and time out'],
'/compensation/grades': ['Salary Grades', 'Define and manage compensation structures across departments.'],
'/compensation/adjustments': ['Adjustment Requests', 'Salary changes and promotions'],
'/benefits/government': ['Government Contributions', 'SSS, PhilHealth and Pag-IBIG'],
'/benefits/hmo': ['HMO Plans', 'Providers and premiums'],
'/benefits/company': ['Company Benefits', 'Allowances and other benefits'],
'/benefits/enrollments': ['Enrollments', 'Employee benefit enrollment'],
'/benefits/loans': ['Loans & Advances', 'Loans and cash advances'],
'/claims': ['Claims & Reimbursement', 'Submit, approve & track'],
'/claims/types': ['Claim Types', 'Limits and requirements'],

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
'/benefits/government': 'HMO & Benefits',
'/benefits/hmo': 'HMO & Benefits',
'/benefits/company': 'HMO & Benefits',
'/benefits/enrollments': 'HMO & Benefits',
'/benefits/loans': 'HMO & Benefits',
'/claims': 'Claims & Reimbursement',
'/claims/types': 'Claims & Reimbursement',
}

export default function Layout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [title, subtitle] = titles[pathname] ?? ['', '']
  const group = groups[pathname]

  useEffect(() => startPolling(), [])
  useEffect(() => setMobileOpen(false), [pathname])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
   <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg-page)' }}>
  {mobileOpen && (
    <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
  )}
  <Sidebar
    collapsed={collapsed}
    onToggle={() => setCollapsed((c) => !c)}
    mobileOpen={mobileOpen}
    onClose={() => setMobileOpen(false)}
  />
      <div className="flex min-w-0 flex-1 flex-col">
<Header dark={dark} onToggleTheme={() => setDark((d) => !d)} onMenu={() => setMobileOpen(true)} />
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
      <ArcChat />
    </div>
  )
}