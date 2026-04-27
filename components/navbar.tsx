'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Menu, X, Music, LayoutDashboard, LogIn, Image as ImageIcon } from 'lucide-react'
import { Surface } from '@/components/landing'
import { brand } from '@/lib/site-data'
import { cn } from '@/lib/utils'

// --- 动画变体配置 ---
const navVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
  }
}

const mobileMenuVariants = {
  closed: { opacity: 0, scale: 0.95, y: -10 },
  open: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
}

type NavbarProps = {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [userName, setUserName] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 监听用户信息
  useEffect(() => {
    const loadUserName = () => {
      setUserName(window.localStorage.getItem('carbon-user-name'))
    }
    loadUserName()
    window.addEventListener('storage', loadUserName)
    return () => window.removeEventListener('storage', loadUserName)
  }, [])

  const userHref = userName?.trim() ? '/profile' : '/login'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className={cn(
        'fixed left-0 right-0 top-4 z-50 px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      <div className="mx-auto max-w-6xl w-full">
        <Surface
          className={cn(
            'relative border-white/60 bg-white/80 px-4 py-2.5 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-2xl transition-all duration-300 sm:px-5',
            isMobileMenuOpen && 'rounded-b-none' // 打开菜单时底部圆角消失，保持一体感
          )}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Logo 区 */}
            <Link href="/" className="flex min-w-0 items-center gap-3 group">
              <motion.div whileHover={{ rotate: -5, scale: 1.05 }} className="shrink-0">
                <Image
                  src="/logo.png"
                  alt={`${brand.name} logo`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-2xl shadow-sm"
                  priority
                />
              </motion.div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors">
                  {brand.name}
                </p>
                <p className="truncate text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                  {brand.slogan}
                </p>
              </div>
            </Link>

            {/* 桌面端导航链接 */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/content" icon={<LayoutDashboard className="h-4 w-4" />}>内容区</NavLink>
              <NavLink href="/music" icon={<Music className="h-4 w-4" />} highlight>音乐工作台</NavLink>
              <NavLink href="/image" icon={<ImageIcon className="h-4 w-4" />}>图片服务</NavLink>
            </nav>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={userHref}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white hover:shadow-md"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white shadow-inner">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="hidden sm:inline">{userName?.trim() ? userName : '立即登录'}</span>
                  {!userName?.trim() && <span className="sm:hidden text-xs">登录</span>}
                </Link>
              </motion.div>

              {/* 移动端菜单开关 */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/50 text-slate-600 transition hover:bg-white md:hidden"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>

          {/* 移动端下拉菜单 */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={mobileMenuVariants}
                className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-3xl border border-white/60 bg-white/95 p-3 shadow-2xl backdrop-blur-3xl md:hidden"
              >
                <div className="flex flex-col gap-2">
                  <MobileNavLink 
                    href="/content" 
                    icon={<LayoutDashboard className="h-5 w-5" />} 
                    label="内容区" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <MobileNavLink 
                    href="/music" 
                    icon={<Music className="h-5 w-5" />} 
                    label="音乐工作台" 
                    highlight
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <MobileNavLink 
                    href="/image" 
                    icon={<ImageIcon className="h-5 w-5" />} 
                    label="图片服务" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  {!userName && (
                    <MobileNavLink 
                      href="/login" 
                      icon={<LogIn className="h-5 w-5" />} 
                      label="注册 / 登录" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Surface>
      </div>
    </motion.div>
  )
}

// --- 桌面端链接组件 ---
function NavLink({ href, children, icon, highlight = false, className }: { href: string; children: React.ReactNode; icon?: React.ReactNode; highlight?: boolean; className?: string }) {
  return (
    <motion.div whileHover={{ y: -1 }}>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
          highlight 
            ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          className
        )}
      >
        {icon}
        {children}
      </Link>
    </motion.div>
  )
}

// --- 移动端链接组件 ---
function MobileNavLink({ href, icon, label, onClick, highlight = false }: { href: string; icon?: React.ReactNode; label?: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-[0.98]",
        highlight 
          ? "bg-cyan-50 text-cyan-700 font-bold" 
          : "bg-slate-50 text-slate-700 font-medium"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm",
        highlight ? "bg-cyan-600 text-white" : "bg-white text-slate-500"
      )}>
        {icon}
      </div>
      <span className="text-base">{label}</span>
    </Link>
  )
}
