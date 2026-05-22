import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, Mail, Phone, Calendar, ShieldOff, Shield } from 'lucide-react'
import { adminApi } from '../utils/api'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    adminApi.getUser(parseInt(id!))
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">加载中...</div>
  }

  if (!user) {
    return <div className="py-20 text-center text-sm text-slate-400">用户不存在</div>
  }

  const handleStatus = async () => {
    const newStatus = user.status === 1 ? 0 : 1
    await adminApi.setUserStatus(user.id, newStatus)
    setUser({ ...user, status: newStatus })
  }

  const handlePro = async () => {
    const newPro = !user.is_pro
    const proExpiresAt = newPro
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null
    await adminApi.setUserPro(user.id, newPro, proExpiresAt || undefined)
    setUser({ ...user, is_pro: newPro ? 1 : 0, pro_expires_at: proExpiresAt })
  }

  return (
    <div className="animate-fadeIn space-y-5 max-w-2xl">
      <button
        onClick={() => navigate('/users')}
        className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-600"
      >
        <ArrowLeft size={14} />
        返回用户列表
      </button>

      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-600">
              {(user.nickname || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{user.nickname || '未设置昵称'}</h1>
              <p className="text-xs text-slate-400">ID: {user.id}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  user.status === 1 ? 'bg-emerald-50 text-emerald-600' : user.status === -1 ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-500'
                }`}>
                  {user.status === 1 ? '正常' : user.status === -1 ? '已删除' : '已禁用'}
                </span>
                {user.is_pro === 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    <Crown size={10} />Pro
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handlePro} className={user.is_pro ? 'btn-secondary text-xs' : 'btn-primary text-xs'}>
              <Crown size={14} />
              {user.is_pro ? '取消 Pro' : '开通 Pro (1年)'}
            </button>
            <button onClick={handleStatus} className={user.status === 1 ? 'btn-danger text-xs' : 'btn-secondary text-xs'}>
              {user.status === 1 ? <ShieldOff size={14} /> : <Shield size={14} />}
              {user.status === 1 ? '禁用' : '启用'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-slate-700">账号信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={Phone} label="手机号" value={user.phone || '未绑定'} />
          <InfoRow icon={Mail} label="邮箱" value={user.email || '未绑定'} />
          <InfoRow icon={Calendar} label="注册时间" value={new Date(user.created_at).toLocaleString('zh-CN')} />
          <InfoRow icon={Calendar} label="最近登录" value={user.last_login_at ? new Date(user.last_login_at).toLocaleString('zh-CN') : '从未登录'} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4">
          <div><p className="text-xs text-slate-400">登录次数</p><p className="text-lg font-bold text-slate-700">{user.login_count || 0}</p></div>
          <div><p className="text-xs text-slate-400">Pro 状态</p><p className="text-lg font-bold text-slate-700">{user.is_pro ? '是' : '否'}</p></div>
          <div><p className="text-xs text-slate-400">Pro 到期</p><p className="text-lg font-bold text-slate-700">{user.pro_expires_at || '无'}</p></div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-slate-300" />
      <div>
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
