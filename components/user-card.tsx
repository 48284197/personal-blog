'use client'

import Image from '@/components/app-image'
import Link from '@/components/app-link'
import { MapPin, Link2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UserCardProps = {
  name: string
  avatarUrl?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  joinedAt?: Date | string | null
  headerColor?: string | null
  headerImage?: string | null
  stats?: {
    posts?: number
    followers?: number
    following?: number
  }
  size?: 'sm' | 'md' | 'lg'
  showBio?: boolean
  className?: string
}

const PRESET_GRADIENTS = [
  'from-cyan-400 via-emerald-400 to-orange-400',
  'from-purple-400 via-pink-400 to-rose-400',
  'from-blue-400 via-indigo-400 to-violet-400',
  'from-amber-400 via-orange-400 to-red-400',
  'from-teal-400 via-cyan-400 to-blue-400',
  'from-lime-400 via-green-400 to-emerald-400',
]

function getGradientFromName(name: string): string {
  const index = name.charCodeAt(0) % PRESET_GRADIENTS.length
  return PRESET_GRADIENTS[index]
}

function getSafeImageSrc(src?: string | null) {
  if (!src) return null
  const value = src.trim()
  if (!value) return null
  if (value.startsWith('/')) return value

  try {
    const url = new URL(value)
    return url.toString()
  } catch {
    return null
  }
}

export function UserCard({
  name,
  avatarUrl,
  bio,
  location,
  website,
  joinedAt,
  headerColor,
  headerImage,
  stats,
  size = 'md',
  showBio = true,
  className,
}: UserCardProps) {
  const gradient = headerColor || getGradientFromName(name)
  const joinedDate = joinedAt
    ? typeof joinedAt === 'string'
      ? new Date(joinedAt)
      : joinedAt
    : null

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      avatar: 'w-8 h-8',
      name: 'text-sm',
      bio: 'text-xs',
      meta: 'text-[10px]',
    },
    md: {
      container: 'gap-3',
      avatar: 'w-10 h-10',
      name: 'text-sm font-semibold',
      bio: 'text-xs',
      meta: 'text-xs',
    },
    lg: {
      container: 'flex-col items-center text-center gap-4',
      avatar: 'w-20 h-20 ring-4 ring-white shadow-lg',
      name: 'text-xl font-bold',
      bio: 'text-sm text-slate-600 max-w-md',
      meta: 'text-sm',
    },
  }

  const classes = sizeClasses[size]

  const safeAvatarUrl = getSafeImageSrc(avatarUrl)

  return (
    <div className={cn('flex', classes.container, className)}>
      {/* Avatar with optional header background */}
      <div className={cn('relative shrink-0', size === 'lg' && '-mt-10')}>
        {size === 'lg' && (
          <div
            className={cn(
              'absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-20 blur-sm',
              gradient
            )}
          />
        )}
        <div
          className={cn(
            'relative overflow-hidden rounded-full bg-gradient-to-br',
            gradient,
            classes.avatar
          )}
        >
          {safeAvatarUrl ? (
            <Image
              src={safeAvatarUrl}
              alt={name}
              fill
              className="object-cover"
              sizes={size === 'lg' ? '80px' : size === 'md' ? '40px' : '32px'}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white font-bold">
              {name.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      <div className={cn('min-w-0 flex-1', size === 'lg' && 'flex flex-col items-center')}>
        <h3 className={cn('text-slate-900 truncate', classes.name)}>{name}</h3>

        {showBio && bio && (
          <p className={cn('text-slate-500 mt-1 line-clamp-2', classes.bio)}>{bio}</p>
        )}

        {/* Meta info */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-1 mt-1',
            size === 'lg' && 'justify-center mt-2',
            classes.meta
          )}
        >
          {location && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700"
            >
              <Link2 className="w-3 h-3" />
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
          {joinedDate && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              {joinedDate.getFullYear()}年{joinedDate.getMonth() + 1}月加入
            </span>
          )}
        </div>

        {/* Stats */}
        {stats && size === 'lg' && (
          <div className="flex items-center gap-6 mt-4">
            {stats.posts !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.posts}</div>
                <div className="text-xs text-slate-400">发布</div>
              </div>
            )}
            {stats.followers !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.followers}</div>
                <div className="text-xs text-slate-400">粉丝</div>
              </div>
            )}
            {stats.following !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats.following}</div>
                <div className="text-xs text-slate-400">关注</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact version for feed items
export function UserAvatar({
  name,
  avatarUrl,
  href,
  size = 'md',
  className,
}: {
  name: string
  avatarUrl?: string | null
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const gradient = getGradientFromName(name)
  const safeAvatarUrl = getSafeImageSrc(avatarUrl)

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const avatarNode = (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br shadow-sm',
        href && 'transition-transform hover:scale-[1.03]',
        gradient,
        sizeClasses[size],
        className
      )}
    >
      {safeAvatarUrl ? (
        <Image
          src={safeAvatarUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={size === 'lg' ? '48px' : size === 'md' ? '36px' : '28px'}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white font-semibold">
          {name.slice(0, 1)}
        </div>
      )}
    </div>
  )

  if (!href) {
    return avatarNode
  }

  return (
    <Link href={href} aria-label={`查看 ${name} 的个人信息`} className="shrink-0">
      {avatarNode}
    </Link>
  )
}
