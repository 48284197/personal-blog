'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Navbar } from '@/components/navbar'
import { Loader2, Save, LogOut, User } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  bio: string | null
  avatar: string | null
  canPublish: boolean
  isAdmin: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/sync')
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/login'); return }
        setProfile(data)
        setName(data.name || '')
        setBio(data.bio || '')
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const res = await fetch('/api/auth/sync', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '保存失败')
    } else {
      setProfile(data)
      setMessage('保存成功')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const inputClass = "w-full px-4 py-3 border border-slate-700 bg-[#0e0e1a] text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:shadow-[0_0_0_1px_rgba(0,212,255,0.15)] font-mono text-sm placeholder:text-slate-600 transition-all"
  const labelClass = "block text-xs font-mono tracking-wider text-slate-400 mb-2 uppercase"

  return (
    <div className="min-h-screen" style={{ background: '#080810' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,212,255,0.07), transparent)' }} />

      <Navbar />

      <main className="relative pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-cyan-500 font-mono text-sm">{'>'}</span>
              <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">user_profile</span>
            </div>
            <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-3">
              <User className="w-6 h-6 text-cyan-400" />
              个人信息
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 账户信息 */}
              <div className="relative border border-slate-800 bg-[#0e0e1a] p-6">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40" />

                <p className="text-xs font-mono tracking-widest text-cyan-400 mb-4 uppercase">// 账户信息</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-16">email</span>
                    <span className="text-sm font-mono text-slate-200">{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-16">role</span>
                    <div className="flex gap-2">
                      {profile?.isAdmin && (
                        <span className="px-2 py-0.5 text-xs font-mono border border-cyan-500/40 text-cyan-400 bg-cyan-500/10">管理员</span>
                      )}
                      {profile?.canPublish && (
                        <span className="px-2 py-0.5 text-xs font-mono border border-purple-500/40 text-purple-400 bg-purple-500/10">发布者</span>
                      )}
                      {!profile?.isAdmin && !profile?.canPublish && (
                        <span className="px-2 py-0.5 text-xs font-mono border border-slate-700 text-slate-500">普通用户</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 编辑资料 */}
              <div className="relative border border-slate-800 bg-[#0e0e1a] p-6">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/40" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-purple-500/40" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-purple-500/40" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-purple-500/40" />

                <p className="text-xs font-mono tracking-widest text-purple-400 mb-5 uppercase">// 编辑资料</p>

                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className={labelClass}>昵称</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={inputClass}
                      placeholder="你的昵称"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>个人简介</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={4}
                      className={`${inputClass} resize-none`}
                      placeholder="介绍一下自己..."
                    />
                  </div>

                  {error && (
                    <div className="relative border border-red-800/60 bg-red-900/10 p-3">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/60" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/60" />
                      <p className="text-xs font-mono text-red-400">{`// error: ${error}`}</p>
                    </div>
                  )}
                  {message && (
                    <div className="relative border border-cyan-800/60 bg-cyan-900/10 p-3">
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/60" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/60" />
                      <p className="text-xs font-mono text-cyan-400">{`// ${message}`}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 px-6 border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-sm tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />saving...</> : <><Save className="w-4 h-4" />保存修改</>}
                  </button>
                </form>
              </div>

              {/* 退出登录 */}
              <button
                onClick={handleLogout}
                className="w-full py-3 px-6 border border-red-800/60 bg-red-900/10 text-red-400 font-mono text-sm tracking-wider hover:bg-red-900/20 hover:border-red-700/60 transition-all flex items-center justify-center gap-2 uppercase"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
