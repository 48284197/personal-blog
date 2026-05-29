'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, BookOpen, Home, Info, MessageCircle, Plus, Search } from 'lucide-react'

const navItems = [
  { label: '首页', href: '/', icon: Home },
  { label: '社区', href: '/content', icon: MessageCircle },
  { label: '知识', href: '/knowledge', icon: BookOpen },
  { label: '关于', href: '/about', icon: Info, activeLabel: '关于我们' },
]

type NavbarProps = {
  activeLabel?: string
  showPublish?: boolean
  publishHref?: string
  onPublishClick?: () => void
  requireKnowledgeCreatorForPublish?: boolean
  userAvatarSrc?: string
  userName?: string
}

type NavbarAuthUser = {
  id?: string
  name: string
  avatarUrl?: string | null
  isKnowledgeCreator?: boolean
}

const AUTH_CACHE_KEY = 'maoqiu-navbar-auth-user'
const AUTH_CACHE_EVENT = 'maoqiu-auth-cache-change'
let cachedAuthUser: NavbarAuthUser | null | undefined

function readCachedAuthUser() {
  if (cachedAuthUser !== undefined) return cachedAuthUser
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY)
    cachedAuthUser = raw ? (JSON.parse(raw) as NavbarAuthUser) : null
  } catch {
    cachedAuthUser = null
  }

  return cachedAuthUser
}

function writeCachedAuthUser(user: NavbarAuthUser | null) {
  cachedAuthUser = user
  if (typeof window === 'undefined') return

  try {
    if (user) {
      window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(AUTH_CACHE_KEY)
    }
    window.dispatchEvent(new CustomEvent(AUTH_CACHE_EVENT, { detail: user }))
  } catch {
    // noop
  }
}

type NotificationItem = {
  id: string
  title: string
  body: string
  actionUrl?: string
  time: string
  read: boolean
}

export function Navbar({
  activeLabel = '首页',
  showPublish = false,
  publishHref = '/content',
  onPublishClick,
  requireKnowledgeCreatorForPublish = false,
  userAvatarSrc,
  userName,
}: NavbarProps) {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<NavbarAuthUser | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = readCachedAuthUser()

    if (cached) {
      setAuthUser(cached)
      setAuthLoaded(true)
    }

    const loadAuthUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })

        if (!response.ok) {
          writeCachedAuthUser(null)
          if (!cancelled) setAuthUser(null)
          return
        }

        const data = (await response.json()) as {
          user?: {
            id?: string
            name?: string
            avatarUrl?: string | null
            isKnowledgeCreator?: boolean
          } | null
        }

        if (!cancelled && data.user?.name) {
          const nextUser = {
            id: data.user.id,
            name: data.user.name,
            avatarUrl: data.user.avatarUrl,
            isKnowledgeCreator: data.user.isKnowledgeCreator,
          }
          writeCachedAuthUser(nextUser)
          setAuthUser(nextUser)
        }
      } catch {
        if (!cancelled && !cached) setAuthUser(null)
      } finally {
        if (!cancelled) setAuthLoaded(true)
      }
    }

    void loadAuthUser()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const syncCachedAuth = (event: Event) => {
      setAuthUser((event as CustomEvent<NavbarAuthUser | null>).detail ?? readCachedAuthUser())
      setAuthLoaded(true)
    }

    window.addEventListener(AUTH_CACHE_EVENT, syncCachedAuth)
    window.addEventListener('storage', syncCachedAuth)
    return () => {
      window.removeEventListener(AUTH_CACHE_EVENT, syncCachedAuth)
      window.removeEventListener('storage', syncCachedAuth)
    }
  }, [])

  useEffect(() => {
    if (!notificationOpen) return
    const onClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notificationOpen])

  const resolvedUserName = authUser?.name ?? userName ?? '用户'
  const resolvedUserAvatar = authUser?.avatarUrl || userAvatarSrc
  const isAuthenticated = Boolean(authUser)
  const canShowAuthenticatedActions = authLoaded && isAuthenticated
  const canShowPublish = requireKnowledgeCreatorForPublish
    ? Boolean(authUser?.isKnowledgeCreator)
    : showPublish && canShowAuthenticatedActions

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (!response.ok) return
        const data = (await response.json()) as {
          items?: NotificationItem[]
          unreadCount?: number
        }
        if (!cancelled) {
          setNotifications(data.items ?? [])
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch {
        // noop
      }
    }

    void loadNotifications()
    return () => { cancelled = true }
  }, [isAuthenticated])

  const handleSearch = () => {
    const q = searchValue.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}&tab=topics`)
  }

  const handleNotificationToggle = async () => {
    const next = !notificationOpen
    setNotificationOpen(next)

    if (!next || unreadCount === 0) return

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      setUnreadCount(0)
    } catch {
      // noop
    }
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1520px] items-center gap-2 px-3 sm:h-[74px] sm:gap-4 sm:px-6 xl:gap-6 xl:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-3">
       
            <Image src="/logo.png" alt="毛球" width={40} height={40} className="flex scale-90 items-center justify-center rounded-full object-contain sm:h-[50px] sm:w-[50px]" />
        
          <span className="whitespace-nowrap text-[21px] font-black tracking-[-0.03em] text-[#2e1a14] sm:text-[28px]">毛球</span>
        </Link>

        <nav className="hidden items-center gap-8 xl:flex">
          {navItems.map((item) => {
            const active = (item.activeLabel ?? item.label) === activeLabel

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

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3 xl:gap-4">
          <label className="hidden h-12 min-w-[220px] max-w-[268px] flex-1 items-center gap-3 rounded-full bg-[#f6f4f1] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] xl:flex">
            <Search className="h-5 w-5 text-black/35" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              placeholder="搜索萌宠、话题或用户"
              className="w-full bg-transparent text-[14px] text-[#2e1a14] outline-none placeholder:text-black/25"
            />
          </label>

          {canShowAuthenticatedActions ? (
            <>
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4] sm:h-11 sm:w-11"
                  aria-label="通知"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff5d4e] sm:right-2 sm:top-2" />
                  ) : null}
                </button>

                {notificationOpen ? (
                  <div className="absolute right-0 top-14 z-[70] w-[320px] overflow-hidden rounded-[28px] border border-[#f4e9d1] bg-white/98 shadow-[0_28px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                    <div className="bg-[radial-gradient(circle_at_top,rgba(245,194,51,0.18),transparent_60%)] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2d0] text-[#d89d13]">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-[22px] font-black text-[#2e1a14]">通知</h3>
                          <p className="text-[12px] text-[#8f8379]">最新动态与互动提醒</p>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto px-4 pb-4">
                      <div className="space-y-3">
                        {notifications.length ? notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.actionUrl || '#'}
                            onClick={() => setNotificationOpen(false)}
                            className="flex gap-3 rounded-[22px] border border-[#f7edd8] bg-[#fffdfa] px-4 py-4 transition hover:bg-white"
                          >
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff2d0] text-[#e1a319]">
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[15px] font-bold text-[#2e1a14]">{item.title}</p>
                                <span className="shrink-0 text-[11px] text-[#aa9b8d]">{item.time}</span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-[#8f8379]">{item.body}</p>
                            </div>
                            {!item.read ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#f5c233]" /> : null}
                          </Link>
                        )) : (
                          <div className="rounded-[22px] border border-dashed border-[#efe2c3] bg-[#fffdfa] px-5 py-10 text-center text-[14px] text-[#8f8379]">
                            暂时还没有新的通知
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:h-11 sm:w-auto sm:gap-3 sm:px-3 sm:pr-4"
              >
                {isAuthenticated ? (
                  <Link
                    href="/profile"
                    aria-label="查看个人信息"
                    className="shrink-0 rounded-full transition-transform hover:scale-[1.03]"
                  >
                    {resolvedUserAvatar ? (
                      <Image
                        src={resolvedUserAvatar}
                        alt={resolvedUserName}
                        width={32}
                        height={32}
                        className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8"
                        unoptimized={resolvedUserAvatar.startsWith('http')}
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5c233] text-[12px] font-black text-[#2e1a14] sm:h-8 sm:w-8 sm:text-[13px]">
                        {resolvedUserName.slice(0, 1)}
                      </span>
                    )}
                  </Link>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5c233] text-[12px] font-black text-[#2e1a14] sm:h-8 sm:w-8 sm:text-[13px]">
                    {resolvedUserName.slice(0, 1)}
                  </span>
                )}
                <span className="hidden max-w-[88px] truncate whitespace-nowrap text-[14px] font-medium text-[#2e1a14] md:inline xl:hidden">
                  {resolvedUserName}
                </span>
              </button>
              {canShowPublish ? (
                onPublishClick ? (
                  <button
                    type="button"
                    onClick={onPublishClick}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c233] text-[14px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f] sm:h-11 sm:w-auto sm:px-5 sm:text-[15px] xl:px-7"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden whitespace-nowrap sm:inline">发布</span>
                  </button>
                ) : (
                  <Link
                    href={publishHref}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c233] text-[14px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f] sm:h-11 sm:w-auto sm:px-5 sm:text-[15px] xl:px-7"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden whitespace-nowrap sm:inline">发布</span>
                  </Link>
                )
              ) : null}
            </>
          ) : authLoaded ? (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-3 text-[13px] font-semibold text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4] sm:h-11 sm:px-5 sm:text-[15px] xl:px-7"
              >
                登录
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#f5c233] px-3 text-[13px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f] sm:h-11 sm:px-5 sm:text-[15px] xl:px-7"
              >
                注册
              </Link>
            </>
          ) : null}
        </div>
      </div>

    </header>
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/94 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:hidden">
      <div className="mx-auto grid h-14 max-w-[520px] grid-cols-4 gap-1">
        {navItems.map((item) => {
          const active = (item.activeLabel ?? item.label) === activeLabel
          const Icon = item.icon

          return (
            <Link
              key={`mobile-${item.label}`}
              href={item.href}
              className={[
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition',
                active
                  ? 'bg-[#fff2c9] text-[#2e1a14]'
                  : 'text-[#7b6f66] active:bg-[#f6f4f1]',
              ].join(' ')}
            >
              <Icon className={active ? 'h-5 w-5 text-[#d69200]' : 'h-5 w-5'} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
    </>
  )
}
