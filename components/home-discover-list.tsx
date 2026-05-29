'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Heart, MessageSquare, UsersRound } from 'lucide-react'
import type { ContentItem } from '@/lib/site-data'

type DiscoverCard = {
  id: string
  title: string
  image?: string
  author: string
  likes: string
  featured?: boolean
}

type JoinSectionItem = {
  label: string
  href: string
  icon: 'message' | 'users' | 'calendar'
  color: string
}

type JoinSectionData = {
  title: string
  emoji: string
  description: string[]
  cta: {
    label: string
    href: string
  }
  items: JoinSectionItem[]
}

const defaultJoinSection: JoinSectionData = {
  title: '',
  emoji: '',
  description: [],
  cta: {
    label: '',
    href: '',
  },
  items: [],
}

const iconMap = {
  message: MessageSquare,
  users: UsersRound,
  calendar: CalendarDays,
}

function formatLikes(value?: number) {
  const count = value ?? 0
  if (count >= 10000) return `${(count / 10000).toFixed(1).replace(/\.0$/, '')}万`
  return String(count)
}

function getCardImage(item: ContentItem) {
  return item.mediaImages?.[0] || item.musicCover || item.mediaSrc
}

function getCardTitle(item: ContentItem) {
  return item.title?.trim() || item.content.replace(/\s+/g, ' ').trim().slice(0, 36) || '毛球新鲜事'
}

function mapFeedItems(items: ContentItem[]) {
  return items.slice(0, 4).map((item, index): DiscoverCard => ({
    id: item.id,
    title: getCardTitle(item),
    image: getCardImage(item),
    author: item.author || '平台编辑',
    likes: formatLikes(item.likes),
    featured: index === 0,
  }))
}

export function HomeDiscoverList() {
  const [cards, setCards] = useState<DiscoverCard[]>([])
  const [loadingCards, setLoadingCards] = useState(true)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [joinSection, setJoinSection] = useState<JoinSectionData>(defaultJoinSection)

  useEffect(() => {
    let cancelled = false

    const loadFeedCards = async () => {
      try {
        const response = await fetch('/api/feed?limit=4', { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as { items?: ContentItem[] }
        if (!cancelled) setCards(data.items?.length ? mapFeedItems(data.items) : [])
      } catch {
        if (!cancelled) setCards([])
      } finally {
        if (!cancelled) setLoadingCards(false)
      }
    }

    void loadFeedCards()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadAuthState = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })

        if (!cancelled) {
          setIsAuthenticated(response.ok)
          setAuthLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false)
          setAuthLoaded(true)
        }
      }
    }

    void loadAuthState()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authLoaded || isAuthenticated) return

    let cancelled = false

    const loadJoinSection = async () => {
      try {
        const response = await fetch('/api/overview', { cache: 'no-store' })
        if (!response.ok) return

        const data = (await response.json()) as { joinSection?: Partial<JoinSectionData> }
        if (!cancelled && data.joinSection) {
          setJoinSection({
            ...defaultJoinSection,
            ...data.joinSection,
            cta: {
              ...defaultJoinSection.cta,
              ...data.joinSection.cta,
            },
            items: data.joinSection.items?.length ? data.joinSection.items as JoinSectionItem[] : [],
            description: data.joinSection.description?.length ? data.joinSection.description : [],
          })
        }
      } catch {
        if (!cancelled) setJoinSection(defaultJoinSection)
      }
    }

    void loadJoinSection()

    return () => {
      cancelled = true
    }
  }, [authLoaded, isAuthenticated])

  const description = useMemo(() => joinSection.description.filter(Boolean), [joinSection.description])
  const showJoinSection = authLoaded && !isAuthenticated && Boolean(joinSection.title)

  return (
    <div className={showJoinSection ? 'grid gap-8 xl:grid-cols-[1fr_310px]' : 'grid gap-8'}>
      <div className="min-w-0">
        {loadingCards ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[330px] animate-pulse rounded-[22px] border border-black/5 bg-[#f6f5f3]" />
            ))}
          </div>
        ) : cards.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <article
                key={card.id}
                className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
              >
                <div className="relative h-[230px] bg-[#f6f5f3]">
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[14px] font-semibold text-[#b5a99f]">
                      暂无封面
                    </div>
                  )}
                  {card.featured ? (
                    <div className="absolute left-3 top-3 rounded-full bg-[#f5c233] px-3 py-1 text-[12px] font-bold text-[#2e1a14] shadow-[0_10px_18px_rgba(245,194,51,0.22)]">
                      猫顶
                    </div>
                  ) : null}
                </div>

                <div className="px-4 pb-4 pt-4">
                  <h3 className="min-h-[36px] text-[17px] font-semibold text-[#241711]">
                    {card.title}
                  </h3>
                  <div className="flex items-center justify-between text-[13px] text-[#8f8379]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-6 w-6 shrink-0 rounded-full bg-[#cdb79f]" />
                      <span className="truncate">{card.author}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{card.likes}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-[#eadfce] bg-[#fffdf8] px-6 py-12 text-center">
            <p className="text-[18px] font-bold text-[#2e1a14]">暂无精彩内容</p>
            <p className="mt-2 text-[14px] text-[#8f8379]">发布内容后，这里会自动展示最新动态。</p>
          </div>
        )}
      </div>

      {showJoinSection ? (
        <aside className="rounded-[30px] border border-[#f3dfb7] bg-[linear-gradient(180deg,#fff9ea_0%,#fffdf8_100%)] px-6 py-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-[#2e1a14]">
            <h3 className="text-[26px] font-black tracking-[-0.04em]">
              {joinSection.title}
            </h3>
            <span className="text-[22px]">{joinSection.emoji}</span>
          </div>

          <p className="mt-4 text-[15px] leading-7 text-[#887c71]">
            {description.map((line, index) => (
              <span key={line}>
                {line}
                {index < description.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>

          {joinSection.cta.href && joinSection.cta.label ? (
            <Link
              href={joinSection.cta.href}
              className="mt-8 flex h-14 items-center justify-center rounded-full bg-[#f5c233] text-[17px] font-bold text-[#2e1a14] shadow-[0_12px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#efba18]"
            >
              {joinSection.cta.label}
            </Link>
          ) : null}

          <div className="mt-6 space-y-3">
            {joinSection.items.map(({ label, href, icon, color }) => {
              const Icon = iconMap[icon] ?? MessageSquare

              return (
                <Link
                  key={label}
                  href={href}
                  className="flex h-14 items-center rounded-full border border-black/5 bg-white px-4 text-[15px] font-medium text-[#2e1a14] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:bg-[#faf8f4]"
                >
                  <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              )
            })}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
