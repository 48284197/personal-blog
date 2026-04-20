'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { Surface } from '@/components/landing'
import { brand } from '@/lib/site-data'
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
        <div className="flex items-center gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt={`${brand.name} logo`}
              width={42}
              height={42}
              className="h-10 w-10 rounded-2xl"
              priority
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{brand.name}</p>
              <p className="truncate text-xs text-slate-500">{brand.slogan}</p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/content"
              className="hidden rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              内容区
            </Link>
            <Link
              href="/music"
              className="hidden rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 sm:inline-flex"
            >
              音乐工作台
            </Link>
            <Link
              href={userHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                <User className="h-4 w-4" />
              </span>
              <span>{userName?.trim() ? userName : '登录'}</span>
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  )
}
