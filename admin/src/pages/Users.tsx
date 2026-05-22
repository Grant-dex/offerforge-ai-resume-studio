import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Search, ShieldOff, Shield } from 'lucide-react'
import { adminApi } from '../utils/api'

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterPro, setFilterPro] = useState<string>('')
  const navigate = useNavigate()

  const loadUsers = async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 20 }
      if (search) params.search = search
      if (filterPro) params.isPro = filterPro
      const res = await adminApi.listUsers(params)
      setUsers(res.list)
      setTotal(res.total)
      setPage(p)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(1)
  }

  const handleStatus = async (id: number, status: number) => {
    await adminApi.setUserStatus(id, status)
    loadUsers(page)
  }

  const handlePro = async (id: number, isPro: boolean) => {
    const proExpiresAt = isPro
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null
    await adminApi.setUserPro(id, isPro, proExpiresAt || undefined)
    loadUsers(page)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">用户管理</h1>
          <p className="mt-1 text-xs text-slate-400">共 {total} 个用户</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-brand-500"
              placeholder="搜索昵称/手机/邮箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary h-9 text-xs">搜索</button>
        </form>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
          value={filterPro}
          onChange={(e) => { setFilterPro(e.target.value); setTimeout(() => loadUsers(1), 0) }}
        >
          <option value="">全部用户</option>
          <option value="1">Pro 用户</option>
          <option value="0">免费用户</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">昵称</th>
              <th className="px-5 py-3 font-medium">手机号</th>
              <th className="px-5 py-3 font-medium">邮箱</th>
              <th className="px-5 py-3 font-medium">Pro</th>
              <th className="px-5 py-3 font-medium">状态</th>
              <th className="px-5 py-3 font-medium">登录次数</th>
              <th className="px-5 py-3 font-medium">最近登录</th>
              <th className="px-5 py-3 font-medium">注册时间</th>
              <th className="px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-400">暂无数据</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-xs text-slate-500">{user.id}</td>
                  <td className="px-5 py-3">
                    <button
                      className="text-xs font-semibold text-brand-600 hover:underline"
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      {user.nickname || '未设置'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{user.phone || '-'}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{user.email || '-'}</td>
                  <td className="px-5 py-3">
                    {user.is_pro ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        <Crown size={10} />Pro
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">免费</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      user.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {user.status === 1 ? '正常' : user.status === -1 ? '已删除' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{user.login_count || 0}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePro(user.id, !user.is_pro)}
                        className="rounded-lg px-2 py-1 text-[10px] font-medium text-amber-600 transition hover:bg-amber-50"
                        title={user.is_pro ? '取消 Pro' : '开通 Pro'}
                      >
                        {user.is_pro ? <Crown size={13} /> : <Crown size={13} className="text-slate-300" />}
                      </button>
                      <button
                        onClick={() => handleStatus(user.id, user.status === 1 ? 0 : 1)}
                        className="rounded-lg px-2 py-1 text-[10px] font-medium transition"
                        title={user.status === 1 ? '禁用' : '启用'}
                      >
                        {user.status === 1
                          ? <ShieldOff size={13} className="text-red-400 hover:text-red-500" />
                          : <Shield size={13} className="text-emerald-400 hover:text-emerald-500" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">第 {page} / {totalPages} 页</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => loadUsers(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition ${
                    p === page
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
