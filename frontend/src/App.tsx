import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payroll from './pages/Payroll'
import Placeholder from './pages/Placeholder'
import PayrollSettings from './pages/PayrollSettings'
import EmployeeData from './pages/EmployeeData'
import Attendance from './pages/Attendance'
import SalaryGrades from './pages/SalaryGrades'
import Adjustments from './pages/Adjustments'
import GovernmentContributions from './pages/GovernmentContributions'
import Login from './pages/Login'
import { isLoggedIn } from './lib/auth'
import UserManagement from './pages/UserManagement'

function RequireAuth({ children }: { children: JSX.Element }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeData />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/payroll/runs" element={<Payroll />} />
        <Route path="/payroll/settings" element={<PayrollSettings />} />
        <Route path="/audit-logs" element={<Placeholder title="Logs & audit" subtitle="System activity trail" />} />
        <Route path="/compensation/grades" element={<SalaryGrades />} />
        <Route path="/compensation/adjustments" element={<Adjustments />} />
        <Route path="/benefits/government" element={<GovernmentContributions />} />
        <Route path="/benefits/hmo" element={<Placeholder title="HMO Plans" subtitle="Providers and premiums" />} />
        <Route path="/benefits/company" element={<Placeholder title="Company Benefits" subtitle="Allowances and other benefits" />} />
        <Route path="/benefits/enrollments" element={<Placeholder title="Enrollments" subtitle="Employee benefit enrollment" />} />
        <Route path="/benefits/loans" element={<Placeholder title="Loans & Advances" subtitle="Loans and cash advances" />} />
        <Route path="/settings" element={<UserManagement />} />
      </Route>
    </Routes>
  )
}