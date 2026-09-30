
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payroll from './pages/Payroll'
import Placeholder from './pages/Placeholder'
import PayrollSettings from './pages/PayrollSettings'
import EmployeeData from './pages/EmployeeData'
import Attendance from './pages/Attendance'
import SalaryGrades from './pages/SalaryGrades'
import Adjustments from './pages/Adjustments'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import { isLoggedIn } from './lib/auth'


function RequireAuth({ children }: { children: JSX.Element }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}
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
        <Route path="/compensation/grades" element={<SalaryGrades />} />
        <Route path="/compensation/adjustments" element={<Adjustments />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}></Route>
        
      </Route>
    </Routes>
  )
}