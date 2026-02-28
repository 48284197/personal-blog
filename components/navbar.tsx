'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { LogIn, User, LogOut } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/comic', label: 'AI漫画' },
  { href: '/about', label: '关于' },
]

interface UserInfo {
  name: string | null
  isAdmin: boolean
}

const supabase = createSupabaseBrowserClient()

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const syncUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setLoggedIn(true)
        // 同步并获取数据库用户信息
        const res = await fetch('/api/auth/sync', { method: 'POST' })
        if (res.ok) {
          const dbUser = await res.json()
          setUserInfo({ name: dbUser.name, isAdmin: dbUser.isAdmin })
        }
      } else {
        setLoggedIn(false)
        setUserInfo(null)
      }
      setChecked(true)
    }

    syncUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoggedIn(true)
        fetch('/api/auth/sync', { method: 'POST' })
          .then(r => r.json())
          .then(dbUser => setUserInfo({ name: dbUser.name, isAdmin: dbUser.isAdmin }))
      } else {
        setLoggedIn(false)
        setUserInfo(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-lg border-b border-cyan-500/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-mono font-bold text-base tracking-wider group">
            <span className="text-cyan-500">&gt;</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 ml-1">
              MY_BLOG
            </span>
            <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono tracking-wider transition-colors ${
                  pathname === link.href
                    ? 'text-cyan-400'
                    : 'text-slate-500 hover:text-cyan-400'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* 仅管理员可见管理入口 */}
            {checked && userInfo?.isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 text-xs font-mono border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/12 hover:border-cyan-500/50 transition-all duration-200 tracking-wider ${
                  pathname.startsWith('/admin') ? 'text-cyan-400' : 'text-cyan-500/80 hover:text-cyan-400'
                }`}
              >
                管理
              </Link>
            )}

            {/* 认证区域 */}
            {checked && (
              loggedIn ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className={`flex items-center gap-1.5 text-xs font-mono tracking-wider transition-colors ${
                      pathname === '/profile' ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    {userInfo?.name || '个人中心'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-red-400 tracking-wider transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-slate-700 text-slate-500 hover:border-cyan-500/40 hover:text-cyan-400 transition-all tracking-wider"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  登录
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
