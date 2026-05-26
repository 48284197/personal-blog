'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Badge, Surface } from '@/components/landing'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'register'

type AuthStep = 'form' | 'code'

type AuthMethod = 'password' | 'otp'

type AuthPanelProps = {
  redirectTo?: string
  initialMode?: AuthMode
}

const OTP_UNAVAILABLE_MESSAGE = '邮箱验证码方式暂未开放，请使用邮箱密码登录或注册。'

function getDisplayName(email: string, fallback?: string) {
  const prefix = email.split('@')[0]?.trim()
  return fallback?.trim() || prefix || '碳基用户'
}

export function AuthPanel({ redirectTo = '/content', initialMode = 'login' }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? 'login')
  const [method, setMethod] = useState<AuthMethod>('password')
  const [step, setStep] = useState<AuthStep>('form')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submitLabel = useMemo(() => {
    if (method === 'password') {
      if (loading) return mode === 'login' ? '登录中...' : '注册中...'
      return mode === 'login' ? '邮箱密码登录' : '注册并登录'
    }

    if (loading) return step === 'code' ? '验证中...' : '发送中...'
    if (step === 'code') return '验证并登录'
    return '发送验证码'
  }, [loading, method, mode, step])

  const persistSession = (name: string, userId?: string, userEmail?: string | null) => {
    window.localStorage.setItem('carbon-user-name', name)
    if (userId) window.localStorage.setItem('carbon-user-id', userId)
    if (userEmail) window.localStorage.setItem('carbon-user-email', userEmail)
  }

  const finishLogin = (name: string, userId?: string, userEmail?: string | null) => {
    persistSession(name, userId, userEmail)
    window.location.assign(redirectTo)
  }

  const syncPlatformAccount = async (name?: string | null) => {
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error('账号同步失败，请稍后重试。')
    }

    const data = (await response.json()) as {
      user?: { id: string; email: string | null; name: string; avatarUrl?: string | null }
    }

    return data.user ?? null
  }

  const resetCodeState = () => {
    setStep('form')
    setCode('')
  }

  const resetStatus = () => {
    setError('')
    setSuccess('')
  }

  const showOtpUnavailable = () => {
    setError(OTP_UNAVAILABLE_MESSAGE)
    setSuccess('')
    resetCodeState()
    setMethod('password')
  }

  const handlePasswordAuth = async () => {
    if (!email.trim()) {
      setError('请先填写邮箱。')
      return
    }

    if (!password.trim()) {
      setError('请先填写密码。')
      return
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('请先填写昵称。')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const client = createSupabaseBrowserClient()
      const normalizedEmail = email.trim()
      const normalizedPassword = password.trim()
      const { data, error: authError } = mode === 'login'
        ? await client.auth.signInWithPassword({
            email: normalizedEmail,
            password: normalizedPassword,
          })
        : await client.auth.signUp({
            email: normalizedEmail,
            password: normalizedPassword,
            options: {
              data: { full_name: displayName.trim(), name: displayName.trim() },
            },
          })

      if (authError) {
        setError(authError.message || (mode === 'login' ? '登录失败，请检查邮箱和密码。' : '注册失败，请稍后重试。'))
        return
      }

      const user = data.user ?? (await client.auth.getUser()).data.user
      const synced = await syncPlatformAccount(mode === 'register' ? displayName.trim() : null)
      const profileName =
        synced?.name ??
        getDisplayName(normalizedEmail, mode === 'register' ? displayName : user?.user_metadata?.full_name || user?.user_metadata?.name)
      finishLogin(profileName, synced?.id ?? user?.id, synced?.email ?? user?.email)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : mode === 'login' ? '登录失败，请稍后重试。' : '注册失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (method === 'password') {
      await handlePasswordAuth()
      return
    }

    if (step === 'code') {
      showOtpUnavailable()
      return
    }
    showOtpUnavailable()
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
                resetStatus()
                resetCodeState()
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
                resetStatus()
                resetCodeState()
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
            {step === 'code'
              ? OTP_UNAVAILABLE_MESSAGE
              : method === 'password'
                ? mode === 'login'
                  ? '使用邮箱和密码登录，继续你的萌宠之旅'
                  : '创建账号并设置密码，开启你的萌宠社区'
                : OTP_UNAVAILABLE_MESSAGE}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2 rounded-[18px] border border-black/5 bg-[#f7f5f2] p-1">
          <button
            type="button"
            onClick={() => {
              setMethod('password')
              resetStatus()
              resetCodeState()
            }}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold transition',
              method === 'password' ? 'bg-white text-[#1f140f] shadow-sm' : 'text-[#8c837a] hover:text-[#1f140f]'
            )}
          >
            <LockKeyhole className="h-4 w-4" />
            邮箱密码
          </button>
          <button
            type="button"
            onClick={() => {
              setError(OTP_UNAVAILABLE_MESSAGE)
              setSuccess('')
              resetCodeState()
            }}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold transition',
              method === 'otp' ? 'bg-white text-[#1f140f] shadow-sm' : 'text-[#b0a8a0] hover:text-[#8c837a]'
            )}
            aria-label="邮箱验证码方式暂未开放"
          >
            <Mail className="h-4 w-4" />
            <span>邮箱验证码</span>
            <span className="rounded-full bg-[#eee7dc] px-2 py-0.5 text-[11px] font-bold text-[#8c837a]">暂未开放</span>
          </button>
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
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
                type="email"
                placeholder="请输入邮箱"
                required
                className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
              />
            </div>
          </label>

          {method === 'password' ? (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[#6f645a]">
                <LockKeyhole className="h-4 w-4 text-[#b28a2d]" />
                密码
              </span>
              <div className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <LockKeyhole className="h-4 w-4 shrink-0 text-[#8f8379]" />
                <input
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'login' ? '请输入密码' : '请设置密码'}
                  required
                  minLength={6}
                  className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
                />
              </div>
            </label>
          ) : null}

          {method === 'otp' && step === 'code' ? (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[14px] font-medium text-[#6f645a]">
                <Loader2 className="h-4 w-4 text-[#b28a2d]" />
                验证码
              </span>
              <div className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="请输入 6 位验证码"
                  required
                  className="w-full bg-transparent text-[15px] text-[#1f140f] outline-none placeholder:text-[#b0a8a0]"
                />
              </div>
            </label>
          ) : null}

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

        {method === 'otp' ? (
          <>
            <div className="mt-7 flex items-center gap-4 text-[#b9b1a7]">
              <span className="h-px flex-1 bg-[#ebe4d9]" />
              <span className="text-[14px]">或</span>
              <span className="h-px flex-1 bg-[#ebe4d9]" />
            </div>

            <button
              type="button"
              onClick={showOtpUnavailable}
              disabled={loading}
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white text-[15px] font-medium text-[#1f140f] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:bg-[#faf8f4] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Mail className="h-4 w-4 text-[#8f8379]" />
              邮箱验证码暂未开放
            </button>
          </>
        ) : null}

        {method === 'otp' && step === 'code' ? (
          <button
            type="button"
            onClick={() => {
              resetCodeState()
              setSuccess('')
            }}
            className="mt-3 w-full text-[14px] font-medium text-[#7d7269] transition hover:text-[#f39a00]"
          >
            返回修改邮箱
          </button>
        ) : null}

        <div className="mt-7 text-center text-[15px] text-[#7d7269]">
          {mode === 'login' ? '还没有账号？' : '已经有账号？'}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              resetStatus()
              resetCodeState()
            }}
            className="ml-2 font-semibold text-[#f39a00] transition hover:text-[#d58900]"
          >
            {mode === 'login' ? '立即注册 →' : '返回登录 →'}
          </button>
        </div>
      </div>
    </Surface>
  )
}
