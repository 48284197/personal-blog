'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/about', label: '关于' },
]

export function Navbar() {
  const pathname = usePathname()

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

            <Link
              href="/admin/posts"
              className="px-3 py-1.5 text-xs font-mono border border-cyan-500/30 bg-cyan-500/5 text-cyan-500/80 hover:bg-cyan-500/12 hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-200 tracking-wider"
            >
              管理
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
