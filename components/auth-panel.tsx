'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Badge, Surface } from '@/components/landing'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'register'

type AuthPanelProps = {
  redirectTo?: string
  initialMode?: AuthMode
}

function getDisplayName(email: string, fallback?: string) {
  const prefix = email.split('@')[0]?.trim()
  return fallback?.trim() || prefix || '碳基用户'
}

export function AuthPanel({ redirectTo = '/content', initialMode = 'login' }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? 'login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submitLabel = useMemo(() => {
    if (loading) return mode === 'login' ? '登录中...' : '注册中...'
    return mode === 'login' ? '登录' : '注册并进入'
  }, [loading, mode])

  const persistSession = (name: string, userId?: string, userEmail?: string | null) => {
    window.localStorage.setItem('carbon-user-name', name)
    if (userId) window.localStorage.setItem('carbon-user-id', userId)
    if (userEmail) window.localStorage.setItem('carbon-user-email', userEmail)
  }

  const finishLogin = (name: string, userId?: string, userEmail?: string | null) => {
    persistSession(name, userId, userEmail)
    window.location.assign(redirectTo)
  }

  const syncPlatformAccount = async () => {
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error('账号同步失败，请稍后重试。')
    }

    const data = (await response.json()) as {
      user?: { id: string; email: string | null; name: string; avatarUrl?: string | null }
    }

    return data.user ?? null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const client = createSupabaseBrowserClient()

      if (mode === 'register' && !displayName.trim()) {
        setError('请先填写昵称。')
        return
      }

      if (mode === 'login') {
        const { data, error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(signInError.message || '登录失败，请检查邮箱和密码。')
          return
        }

        const user = data.user ?? (await client.auth.getUser()).data.user
        const synced = await syncPlatformAccount()
        const profileName =
          synced?.name ??
          getDisplayName(email, user?.user_metadata?.full_name || user?.user_metadata?.name)
        finishLogin(profileName, synced?.id ?? user?.id, synced?.email ?? user?.email)
        return
      }

      const { data, error: signUpError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?mode=login`,
          data: {
            full_name: displayName.trim(),
            name: displayName.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message || '注册失败，请稍后重试。')
        return
      }

      const user = data.user
      const session = data.session
      const synced = session ? await syncPlatformAccount() : null
      const profileName = synced?.name ?? getDisplayName(email, displayName)

      if (session) {
        finishLogin(profileName, synced?.id ?? user?.id, synced?.email ?? user?.email)
        return
      }

      setSuccess('注册已提交，请先去邮箱完成确认，然后返回登录。')
      setMode('login')
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录过程发生异常。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Surface className="overflow-hidden border-white/80 bg-white/95 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
      <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#f5c233]" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full rounded-full border border-black/5 bg-[#f7f5f2] p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
              }}
              className={cn(
                'min-w-0 flex-1 whitespace-nowrap rounded-full px-5 py-2 text-[14px] font-semibold transition sm:min-w-[92px] sm:flex-none',
                mode === 'login' ? 'bg-white text-[#1f140f] shadow-sm' : 'text-[#8c837a]'
              )}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
                setSuccess('')
              }}
              className={cn(
                'min-w-0 flex-1 whitespace-nowrap rounded-full px-5 py-2 text-[14px] font-semibold transition sm:min-w-[92px] sm:flex-none',
                mode === 'register' ? 'bg-white text-[#1f140f] shadow-sm' : 'text-[#8c837a]'
              )}
            >
              注册
            </button>
          </div>

          <Badge tone="orange" className="w-fit self-start whitespace-nowrap border-[#f3dfb7] bg-[#fff8e9] text-[#d89000] sm:self-auto">
            {mode === 'login' ? 'welcome back' : 'join maoqiu'}
          </Badge>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-[clamp(2rem,2.8vw,3rem)] font-black tracking-[-0.05em] text-[#1f140f]">
            {mode === 'login' ? '欢迎回来' : '加入毛球'}
            <span className="ml-2">{mode === 'login' ? '👋' : '✨'}</span>
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-[#8c837a]">
            {mode === 'login'
              ? '登录毛球账号，继续你的萌宠之旅'
              : '创建账号，开启你的萌宠社区'}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[#6f645a]">
                <UserRound className="h-4 w-4 text-[#b28a2d]" />
                昵称
              </span>
              <div className="rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="请输入昵称"
                  required
                  className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
                />
              </div>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[#6f645a]">
              <Mail className="h-4 w-4 text-[#b28a2d]" />
              邮箱
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <Mail className="h-4 w-4 shrink-0 text-[#8f8379]" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="请输入邮箱"
                required
                className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[#6f645a]">
              <Lock className="h-4 w-4 text-[#b28a2d]" />
              密码
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <Lock className="h-4 w-4 shrink-0 text-[#8f8379]" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                required
                minLength={6}
                className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8f8379] transition hover:bg-[#f7f5f2]"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between gap-4 text-[14px]">
            <label className="flex items-center gap-2 text-[#6f645a]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-black/15 text-[#f5c233] focus:ring-[#f5c233]"
              />
              记住我
            </label>
            <button
              type="button"
              className="font-medium text-[#f39a00] transition hover:text-[#d58900]"
            >
              忘记密码？
            </button>
          </div>

          {error ? (
            <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#f5c233] text-[17px] font-bold text-[#2e1a14] shadow-[0_14px_30px_rgba(245,194,51,0.26)] transition hover:bg-[#efba18] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitLabel}
          </button>
        </form>

        <div className="mt-7 flex items-center gap-4 text-[#b9b1a7]">
          <span className="h-px flex-1 bg-[#ebe4d9]" />
          <span className="text-[14px]">或</span>
          <span className="h-px flex-1 bg-[#ebe4d9]" />
        </div>

        <button
          type="button"
          className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white text-[15px] font-medium text-[#1f140f] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#faf8f4]"
        >
          <Mail className="h-4 w-4 text-[#8f8379]" />
          使用邮箱验证码登录
        </button>

        <div className="mt-7 text-center text-[15px] text-[#7d7269]">
          还没有账号？
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
              setSuccess('')
            }}
            className="ml-2 font-semibold text-[#f39a00] transition hover:text-[#d58900]"
          >
            立即注册 →
          </button>
        </div>
      </div>
    </Surface>
  )
}
