import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { adminApi, clearToken } from '../utils/api'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  const [admin, setAdmin] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    adminApi.me()
      .then(setAdmin)
      .catch(() => navigate('/login'))
  }, [])

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  if (!admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F6F7FB]">
        <div className="text-sm text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F7FB] text-slate-800">
      <Sidebar admin={admin} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
