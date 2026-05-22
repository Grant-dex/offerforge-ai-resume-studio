import { LayoutDashboard, LogOut, ScrollText, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/users', icon: Users, label: '用户管理' },
  { path: '/logs', icon: ScrollText, label: '操作日志' },
]

export function Sidebar({ admin, onLogout }: { admin: any; onLogout: () => void }) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">O</div>
        <div>
          <p className="text-sm font-bold text-slate-700">OfferForge</p>
          <p className="text-[10px] text-slate-400">管理后台</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
            {admin.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">{admin.username}</p>
            <p className="text-[10px] text-slate-400">{admin.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-400 transition hover:border-red-200 hover:text-red-500"
        >
          <LogOut size={13} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
