'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }

      // 同步用户到数据库
      await fetch('/api/auth/sync', { method: 'POST' })

      router.push(redirect)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败'
      setError(msg === 'Invalid login credentials' ? '邮箱或密码错误' : msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-slate-700 bg-[#0e0e1a] text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:shadow-[0_0_0_1px_rgba(0,212,255,0.15)] font-mono text-sm placeholder:text-slate-600 transition-all"

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
      {/* 背景网格 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,212,255,0.07), transparent)' }}
      />

      <div className="relative w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block font-mono font-bold text-lg tracking-wider">
            <span className="text-cyan-500">{'>'}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 ml-1">MY_BLOG</span>
            <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
          </a>
        </div>

        {/* 卡片 */}
        <div className="relative border border-slate-800 bg-[#0e0e1a] p-8">
          {/* 四角装饰 */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40" />

          <h1 className="text-sm font-mono tracking-widest text-cyan-400 mb-6 uppercase">
            {mode === 'login' ? '// 登录账户' : '// 注册账户'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 mb-2 uppercase">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-slate-400 mb-2 uppercase">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pl-10 pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="relative border border-red-800/60 bg-red-900/10 p-3">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/60" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/60" />
                <p className="text-xs font-mono text-red-400">{`// error: ${error}`}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-sm tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400/60 hover:shadow-[0_0_16px_rgba(0,212,255,0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> processing...</>
              ) : (
                <><LogIn className="w-4 h-4" />{mode === 'login' ? '登录' : '注册'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
            >
              {mode === 'login' ? '// 没有账户？注册' : '// 已有账户？登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
