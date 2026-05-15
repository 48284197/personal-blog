'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, ChevronDown, Plus, Search } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { label: '首页', href: '/' },
  { label: '社区', href: '/content' },
  { label: '发现', href: '#' },
  { label: '活动', href: '#' },
  { label: '知识', href: '#' },
  { label: '关于我们', href: '/about' },
]

type NavbarProps = {
  activeLabel?: string
  showPublish?: boolean
  publishHref?: string
  onPublishClick?: () => void
  userAvatarSrc?: string
  userName?: string
}

type NavbarAuthUser = {
  name: string
  avatarUrl?: string | null
}

export function Navbar({
  activeLabel = '首页',
  showPublish = false,
  publishHref = '/content',
  onPublishClick,
  userAvatarSrc = '/logo.png',
  userName = '毛球',
}: NavbarProps) {
  const [authUser, setAuthUser] = useState<NavbarAuthUser | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadAuthUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          if (!cancelled) setAuthUser(null)
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          if (!cancelled) setAuthUser(null)
          return
        }

        const data = (await response.json()) as {
          user?: {
            name?: string
            avatarUrl?: string | null
          } | null
        }

        if (!cancelled && data.user?.name) {
          setAuthUser({
            name: data.user.name,
            avatarUrl: data.user.avatarUrl,
          })
        }
      } catch {
        if (!cancelled) setAuthUser(null)
      }
    }

    void loadAuthUser()

    return () => {
      cancelled = true
    }
  }, [])

  const resolvedUserName = authUser?.name ?? userName
  const resolvedUserAvatar = authUser?.avatarUrl || userAvatarSrc
  const isAuthenticated = Boolean(authUser)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-full max-w-[1520px] items-center gap-3 px-4 sm:gap-4 sm:px-6 xl:gap-6 xl:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c233] shadow-[0_8px_20px_rgba(245,194,51,0.3)]">
            <Image src="/logo.png" alt="毛球" width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <span className="whitespace-nowrap text-[24px] font-black tracking-[-0.03em] text-[#2e1a14] sm:text-[28px]">毛球</span>
        </Link>

        <nav className="hidden items-center gap-8 xl:flex">
          {navItems.map((item) => {
            const active = item.label === activeLabel

            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative whitespace-nowrap py-2 text-[17px] font-semibold text-[#2e1a14] transition hover:text-[#111111]"
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-4 h-[3px] rounded-full bg-[#f5c233]" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3 xl:gap-4">
          <label className="hidden h-12 min-w-[220px] max-w-[268px] flex-1 items-center gap-3 rounded-full bg-[#f6f4f1] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] xl:flex">
            <Search className="h-5 w-5 text-black/35" />
            <input
              type="search"
              placeholder="搜索萌宠、话题或用户"
              className="w-full bg-transparent text-[14px] text-[#2e1a14] outline-none placeholder:text-black/25"
            />
          </label>

          {showPublish || isAuthenticated ? (
            <>
              <button
                type="button"
                className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4]"
                aria-label="通知"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff5d4e]" />
              </button>
              <button
                type="button"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-3 pr-3 shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:gap-3 sm:pr-4"
              >
                {isAuthenticated ? (
                  <Link
                    href="/profile"
                    aria-label="查看个人信息"
                    className="shrink-0 rounded-full transition-transform hover:scale-[1.03]"
                  >
                    <Image
                      src={resolvedUserAvatar}
                      alt={resolvedUserName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      unoptimized={resolvedUserAvatar.startsWith('http')}
                    />
                  </Link>
                ) : (
                  <Image
                    src={resolvedUserAvatar}
                    alt={resolvedUserName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    unoptimized={resolvedUserAvatar.startsWith('http')}
                  />
                )}
                <span className="hidden max-w-[88px] truncate whitespace-nowrap text-[14px] font-medium text-[#2e1a14] md:inline xl:hidden">
                  {resolvedUserName}
                </span>
                <ChevronDown className="h-4 w-4 text-black/40" />
              </button>
              <button
                type="button"
                onClick={onPublishClick}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c233] px-4 text-[14px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f] sm:px-5 sm:text-[15px] xl:px-7"
              >
                <Plus className="h-4 w-4" />
                <span className="whitespace-nowrap">发布</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-[14px] font-semibold text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4] sm:px-5 sm:text-[15px] xl:px-7"
              >
                登录
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#f5c233] px-4 text-[14px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f] sm:px-5 sm:text-[15px] xl:px-7"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-black/5 bg-white/80 xl:hidden">
        <div className="mx-auto flex h-12 w-full max-w-[1520px] items-center gap-2 overflow-x-auto px-4 sm:px-6">
          {navItems.map((item) => {
            const active = item.label === activeLabel

            return (
              <Link
                key={`tablet-${item.label}`}
                href={item.href}
                className={[
                  'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition',
                  active
                    ? 'bg-[#f5c233] text-[#2e1a14]'
                    : 'bg-[#f6f4f1] text-[#65584f] hover:bg-[#ece7df]',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
