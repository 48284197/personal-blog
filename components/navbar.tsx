import Image from 'next/image'
import Link from 'next/link'
import { Bell, ChevronDown, Plus, Search } from 'lucide-react'

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
  userAvatarSrc?: string
  userName?: string
}

export function Navbar({
  activeLabel = '首页',
  showPublish = false,
  publishHref = '/content',
  userAvatarSrc = '/logo.png',
  userName = '毛球',
}: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-full max-w-[1520px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c233] shadow-[0_8px_20px_rgba(245,194,51,0.3)]">
            <Image src="/logo.png" alt="毛球" width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <span className="text-[28px] font-black tracking-[-0.03em] text-[#2e1a14]">毛球</span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => {
            const active = item.label === activeLabel

            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative py-2 text-[17px] font-semibold text-[#2e1a14] transition hover:text-[#111111]"
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-4 h-[3px] rounded-full bg-[#f5c233]" />
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <label className="hidden h-12 w-[268px] items-center gap-3 rounded-full bg-[#f6f4f1] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] lg:flex">
            <Search className="h-5 w-5 text-black/35" />
            <input
              type="search"
              placeholder="搜索萌宠、话题或用户"
              className="w-full bg-transparent text-[14px] text-[#2e1a14] outline-none placeholder:text-black/25"
            />
          </label>

          {showPublish ? (
            <>
              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4]"
                aria-label="通知"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff5d4e]" />
              </button>
              <button
                type="button"
                className="flex h-11 items-center gap-3 rounded-full bg-white px-3 pr-4 shadow-[0_1px_0_rgba(255,255,255,0.8)]"
              >
                <Image
                  src={userAvatarSrc}
                  alt={userName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  unoptimized={userAvatarSrc.startsWith('http')}
                />
                <ChevronDown className="h-4 w-4 text-black/40" />
              </button>
              <Link
                href={publishHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#f5c233] px-7 text-[15px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f]"
              >
                <Plus className="h-4 w-4" />
                发布
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-7 text-[15px] font-semibold text-[#2e1a14] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:bg-[#faf8f4]"
              >
                登录
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#f5c233] px-7 text-[15px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#f1b91f]"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
