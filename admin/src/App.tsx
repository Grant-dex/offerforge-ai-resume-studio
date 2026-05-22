import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/Layout'
import { DashboardPage } from './pages/Dashboard'
import { UsersPage } from './pages/Users'
import { UserDetailPage } from './pages/UserDetail'
import { LogsPage } from './pages/Logs'
import { LoginPage } from './pages/Login'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  )
}
