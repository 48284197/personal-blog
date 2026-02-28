'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/back-button'
import { Loader2, Shield, ShieldOff, Trash2, Users } from 'lucide-react'
import dayjs from 'dayjs'

interface UserRow {
  id: string
  email: string
  name: string | null
  bio: string | null
  avatar: string | null
  canPublish: boolean
  isAdmin: boolean
  createdAt: string
  _count: { posts: number; comics: number }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 403) { router.push('/'); return }
    const data = await res.json()
    if (!res.ok) { setError(data.error || '加载失败'); return }
    setUsers(data)
    setLoading(false)
  }, [router])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleToggle = async (id: string, field: 'canPublish' | 'isAdmin', value: boolean) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u))
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`确定要删除用户 ${email} 吗？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-lg border-b border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <BackButton className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest">// 用户管理</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-5 h-5 text-cyan-500" />
            <h1 className="text-xl font-mono font-bold text-slate-200">
              <span className="text-cyan-500">{'>'}</span> 用户管理
            </h1>
            <span className="text-xs font-mono text-slate-600">({users.length} 个用户)</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : error ? (
            <div className="relative border border-red-800/60 bg-red-900/10 p-4">
              <p className="text-xs font-mono text-red-400">{`// error: ${error}`}</p>
            </div>
          ) : (
            <div className="border border-slate-800 bg-[#0e0e1a] relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40" />

              {/* 表头 */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-slate-800 text-xs font-mono text-slate-500 tracking-wider uppercase">
                <span>用户</span>
                <span className="text-center w-16">文章</span>
                <span className="text-center w-16">漫画</span>
                <span className="text-center w-20">发布权限</span>
                <span className="text-center w-16">管理员</span>
                <span className="text-center w-16">操作</span>
              </div>

              {users.map((user, idx) => (
                <div
                  key={user.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 items-center ${idx < users.length - 1 ? 'border-b border-slate-800/60' : ''} hover:bg-slate-800/20 transition-colors`}
                >
                  {/* 用户信息 */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-slate-200">{user.name || '未设置昵称'}</span>
                      {user.isAdmin && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono border border-cyan-500/40 text-cyan-400 bg-cyan-500/10">ADMIN</span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{user.email}</div>
                    <div className="text-xs font-mono text-slate-700 mt-0.5">{dayjs(user.createdAt).format('YYYY-MM-DD')}</div>
                  </div>

                  {/* 文章数 */}
                  <span className="text-xs font-mono text-slate-400 text-center w-16">{user._count.posts}</span>

                  {/* 漫画数 */}
                  <span className="text-xs font-mono text-slate-400 text-center w-16">{user._count.comics}</span>

                  {/* 发布权限 */}
                  <div className="w-20 flex justify-center">
                    <button
                      onClick={() => handleToggle(user.id, 'canPublish', !user.canPublish)}
                      className={`px-2 py-1 text-[10px] font-mono border transition-all ${
                        user.canPublish
                          ? 'border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                          : 'border-slate-700 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {user.canPublish ? '已授权' : '授权'}
                    </button>
                  </div>

                  {/* 管理员 */}
                  <div className="w-16 flex justify-center">
                    <button
                      onClick={() => handleToggle(user.id, 'isAdmin', !user.isAdmin)}
                      className={`p-1.5 border transition-all ${
                        user.isAdmin
                          ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                          : 'border-slate-700 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                      }`}
                      title={user.isAdmin ? '撤销管理员' : '设为管理员'}
                    >
                      {user.isAdmin ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* 删除 */}
                  <div className="w-16 flex justify-center">
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      className="p-1.5 border border-slate-700 text-slate-600 hover:border-red-800/60 hover:text-red-400 hover:bg-red-900/10 transition-all"
                      title="删除用户"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="py-12 text-center font-mono text-xs text-slate-600">
                  // 暂无用户数据
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
