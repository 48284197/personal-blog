'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Lock, Mail, UserRound } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Badge, Surface } from '@/components/landing'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'register'

type AuthPanelProps = {
  redirectTo?: string
  initialMode?: AuthMode
}

const loginBenefits = [
  {
    title: '发内容',
    text: '发布图片、视频、音乐和话题内容。',
  },
  {
    title: '参与讨论',
    text: '评论、回复、@ 某个人。',
  },
  {
    title: '保存身份',
    text: '登录后自动记住你的名字和状态。',
  },
]

function getDisplayName(email: string, fallback?: string) {
  const prefix = email.split('@')[0]?.trim()
  return fallback?.trim() || prefix || '碳基用户'
}

export function AuthPanel({ redirectTo = '/content', initialMode = 'login' }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? 'login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <Surface className="overflow-hidden border-white/70 bg-white/90 p-0 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
      <div className="relative p-5 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-orange-400" />

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
              setSuccess('')
            }}
            className={cn(
              'flex-1 rounded-full px-4 py-2 transition',
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
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
              'flex-1 rounded-full px-4 py-2 transition',
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            注册
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <UserRound className="h-4 w-4 text-cyan-600" />
                昵称
              </span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="你的社区名字"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4 text-cyan-600" />
              邮箱
            </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="name@example.com"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
              />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Lock className="h-4 w-4 text-cyan-600" />
              密码
            </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="至少 6 位"
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
              />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 grid gap-3">
          {loginBenefits.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge tone="cyan">supabase auth</Badge>
          <Badge tone="slate">评论</Badge>
          <Badge tone="slate">发内容</Badge>
          <Badge tone="slate">@ 回复</Badge>
        </div>
      </div>
    </Surface>
  )
}
