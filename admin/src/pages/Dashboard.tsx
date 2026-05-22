import { useEffect, useState } from 'react'
import { Users, UserPlus, Crown, Activity, BarChart3, TrendingUp } from 'lucide-react'
import { adminApi } from '../utils/api'

interface DashboardData {
  totalUsers: number
  todayNewUsers: number
  proUsers: number
  activeToday: number
  totalLogins: number
  newUsersTrend: { date: string; count: number }[]
  aiToday: number
  aiTotal: number
  proExpiringSoon: number
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.dashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-slate-400">加载中...</div>
  }

  if (!data) {
    return <div className="py-20 text-center text-sm text-slate-400">加载失败</div>
  }

  const stats = [
    { icon: Users, label: '总用户数', value: data.totalUsers.toLocaleString(), color: 'text-brand-500', bg: 'bg-brand-50' },
    { icon: UserPlus, label: '今日新增', value: data.todayNewUsers.toString(), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Crown, label: 'Pro 用户', value: data.proUsers.toString(), color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Activity, label: '今日活跃', value: data.activeToday.toString(), color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: 'AI 调用总计', value: data.aiTotal.toLocaleString(), color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: BarChart3, label: 'Pro 即将到期', value: data.proExpiringSoon.toString(), color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div className="animate-fadeIn space-y-6">
      <h1 className="text-xl font-bold text-slate-800">仪表盘</h1>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New users trend */}
      <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-slate-700">近 7 日新增用户</h2>
        <div className="flex items-end gap-4" style={{ height: 120 }}>
          {data.newUsersTrend.map((item) => {
            const maxCount = Math.max(...data.newUsersTrend.map(d => d.count), 1)
            const height = (item.count / maxCount) * 100
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">{item.count}</span>
                <div
                  className="w-full rounded-lg bg-brand-500 transition-all"
                  style={{ height: `${Math.max(4, height)}%` }}
                />
                <span className="text-[10px] text-slate-400">
                  {item.date.slice(5)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
