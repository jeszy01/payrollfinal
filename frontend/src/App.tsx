import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Payroll from './pages/Payroll'
import PayrollSettings from './pages/PayrollSettings'
import EmployeeData from './pages/EmployeeData'
import Attendance from './pages/Attendance'
import SalaryGrades from './pages/SalaryGrades'
import Adjustments from './pages/Adjustments'
import GovernmentContributions from './pages/GovernmentContributions'
import HmoPlans from './pages/HmoPlans'
import CompanyBenefits from './pages/CompanyBenefits'
import Enrollments from './pages/Enrollments'
import Loans from './pages/Loans'
import Claims from './pages/Claims'
import AuditLogs from './pages/AuditLogs'
import ClaimTypes from './pages/ClaimTypes'
import Login from './pages/Login'
import Devices from './pages/Devices'
import { isLoggedIn } from './lib/auth'
import { useSessionWatch } from './lib/useSessionWatch'
import UserManagement from './pages/UserManagement'
import Notifications from './pages/Notifications'
import Overtime from './pages/Overtime'
import Holidays from './pages/Holidays'

function RequireAuth({ children }: { children: JSX.Element }) {
  useSessionWatch()
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
        <Route path="/audit-logs" element={<Devices />} />
        <Route path="/activity-logs" element={<AuditLogs />} />
        <Route path="/devices" element={<Navigate to="/audit-logs" replace />} />
        <Route path="/compensation/grades" element={<SalaryGrades />} />
        <Route path="/compensation/adjustments" element={<Adjustments />} />
        <Route path="/benefits/government" element={<GovernmentContributions />} />
        <Route path="/benefits/hmo" element={<HmoPlans />} />
        <Route path="/benefits/company" element={<CompanyBenefits />} />
        <Route path="/benefits/enrollments" element={<Enrollments />} />
        <Route path="/benefits/loans" element={<Loans />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/claims/types" element={<ClaimTypes />} />
        <Route path="/settings" element={<UserManagement />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/overtime" element={<Overtime />} />
                <Route path="/payroll/holidays" element={<Holidays />} />
      </Route>
    </Routes>
  )
}