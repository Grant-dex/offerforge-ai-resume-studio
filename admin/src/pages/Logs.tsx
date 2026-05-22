import { useEffect, useState } from 'react'
import { adminApi } from '../utils/api'

const actionLabels: Record<string, string> = {
  admin_login: '管理员登录',
  create_admin: '创建管理员',
  toggle_admin: '启/禁管理员',
  change_password: '修改密码',
  enable_user: '启用用户',
  disable_user: '禁用用户',
  grant_pro: '开通 Pro',
  revoke_pro: '取消 Pro',
  delete_user: '删除用户',
}

const actionColors: Record<string, string> = {
  admin_login: 'bg-slate-50 text-slate-600',
  create_admin: 'bg-brand-50 text-brand-600',
  toggle_admin: 'bg-amber-50 text-amber-600',
  change_password: 'bg-slate-50 text-slate-600',
  enable_user: 'bg-emerald-50 text-emerald-600',
  disable_user: 'bg-red-50 text-red-500',
  grant_pro: 'bg-amber-50 text-amber-600',
  revoke_pro: 'bg-slate-50 text-slate-600',
  delete_user: 'bg-red-50 text-red-500',
}

export function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')

  const loadLogs = async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 20 }
      if (filterAction) params.action = filterAction
      const res = await adminApi.listLogs(params)
      setLogs(res.list)
      setTotal(res.total)
      setPage(p)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadLogs(1) }, [filterAction])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">操作日志</h1>
          <p className="mt-1 text-xs text-slate-400">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value) }}
          >
            <option value="">全部操作</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">时间</th>
              <th className="px-5 py-3 font-medium">操作人</th>
              <th className="px-5 py-3 font-medium">操作类型</th>
              <th className="px-5 py-3 font-medium">目标</th>
              <th className="px-5 py-3 font-medium">详情</th>
              <th className="px-5 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">加载中...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">暂无操作日志</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-700">
                    {log.admin_name || `ID:${log.admin_id}`}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${actionColors[log.action] || 'bg-slate-50 text-slate-600'}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {log.target_type ? `${log.target_type}#${log.target_id}` : '-'}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-xs text-slate-400">
                    {log.detail || '-'}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{log.ip || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">第 {page} / {totalPages} 页</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => loadLogs(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition ${
                    p === page ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'
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
