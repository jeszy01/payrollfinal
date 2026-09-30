import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payroll from './pages/Payroll'
import Placeholder from './pages/Placeholder'
import PayrollSettings from './pages/PayrollSettings'
import EmployeeData from './pages/EmployeeData'
import Attendance from './pages/Attendance'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeData />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/payroll/runs" element={<Payroll />} />
        <Route path="/payroll/settings" element={<PayrollSettings />} />
        <Route path="/audit-logs" element={<Placeholder title="Logs & audit" subtitle="System activity trail" />} />
        <Route path="/settings" element={<Placeholder title="User & account settings" subtitle="Manage your account" />} />
      </Route>
    </Routes>
  )
}