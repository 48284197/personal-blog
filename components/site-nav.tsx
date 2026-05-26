'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Image as ImageIcon, User } from 'lucide-react'
import { Surface } from '@/components/landing'
import { cn } from '@/lib/utils'

type SiteNavProps = {
  userHref: string
  userName?: string | null
  className?: string
}

export function SiteNav({
  userHref,
  userName,
  className,
}: SiteNavProps) {
  return (
    <div
      className={cn(
        'z-40 mx-auto w-full transition-all duration-300',
        'max-w-6xl',
        className
      )}
    >
      <Surface
        className={cn(
          'border-white/60 bg-white/75 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:px-5',
        )}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="毛球"
              width={50}
              height={50}
              className="flex scale-90 items-center justify-center rounded-full object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="truncate whitespace-nowrap text-[24px] font-black tracking-[-0.03em] text-[#2e1a14] sm:text-[28px]">毛球</p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2 overflow-x-auto">
            <Link
              href="/content"
              className="hidden shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            >
              内容区
            </Link>
            <Link
              href="/music"
              className="hidden shrink-0 whitespace-nowrap rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 md:inline-flex"
            >
              音乐工作台
            </Link>
            <Link
              href="/image"
              className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 lg:inline-flex"
            >
              <ImageIcon className="h-4 w-4" />
              图片服务
            </Link>
            <Link
              href={userHref}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:px-4"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                <User className="h-4 w-4" />
              </span>
              <span className="max-w-[88px] truncate">{userName?.trim() ? userName : '登录'}</span>
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  )
}
