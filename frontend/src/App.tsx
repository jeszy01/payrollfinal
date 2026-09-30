import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payroll from './pages/Payroll'
import Placeholder from './pages/Placeholder'
import PayrollSettings from './pages/PayrollSettings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payroll/runs" element={<Payroll />} />
        <Route path="/audit-logs" element={<Placeholder title="Logs & audit" subtitle="System activity trail" />} />
        <Route path="/settings" element={<Placeholder title="User & account settings" subtitle="Manage your account" />} />
        <Route path="/payroll/settings" element={<PayrollSettings />} />
      </Route>
    </Routes>
  )
}
