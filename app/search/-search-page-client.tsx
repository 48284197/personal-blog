'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from '@/components/app-image'
import Link from '@/components/app-link'
import { useRouter, useSearchParams } from '@/lib/navigation'
import { Loader2, Search, PawPrint, Users, Hash, FileText } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'
import { FollowButton } from '@/components/follow-button'
import type { ContentItem } from '@/lib/site-data'

type SearchTab = 'topics' | 'users' | 'content'

type SearchResponse = {
  query: string
  topics: Array<{ id: string; title: string; description: string; views: number; discussions: number }>
  users: Array<{ id: string; name: string; avatarUrl: string; bio: string; postsCount: number; followersCount: number; isFollowing: boolean }>
  content: ContentItem[]
}

const tabs: Array<{ key: SearchTab; label: string; icon: typeof Hash }> = [
  { key: 'topics', label: '话题', icon: Hash },
  { key: 'users', label: '人', icon: Users },
  { key: 'content', label: '内容', icon: FileText },
]

export default function SearchPageClient() {
  const params = useSearchParams()
  const router = useRouter()
  const query = params.get('q') ?? ''
  const initialTab = (params.get('tab') as SearchTab | null) ?? 'topics'
  const [input, setInput] = useState(query)
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SearchResponse>({ query: '', topics: [], users: [], content: [] })

  useEffect(() => {
    setInput(query)
  }, [query])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) return
        const result = (await response.json()) as SearchResponse
        if (!cancelled) setData(result)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [query])

  const counts = useMemo(() => ({
    topics: data.topics.length,
    users: data.users.length,
    content: data.content.length,
  }), [data])

  const handleSearch = () => {
    const q = input.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}&tab=${activeTab}`)
  }

  return (
    <main className="min-h-screen bg-[#f8f4ee]">
      <Navbar activeLabel="社区" />
      <div className="relative overflow-hidden pb-24 pt-[72px] sm:pt-[96px] xl:pb-0 xl:pt-[96px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,216,150,0.26),transparent_38%),radial-gradient(circle_at_bottom,rgba(253,240,214,0.72),transparent_44%)]" />
        <PawPrint className="pointer-events-none absolute right-[10%] top-28 h-20 w-20 text-[#f5c233]/15" />
        <PawPrint className="pointer-events-none absolute left-[12%] top-[28rem] h-14 w-14 text-[#f3bf4c]/10" />

        <div className="relative mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 xl:px-10">
          <Link href="/content" className="inline-flex items-center rounded-full border border-[#f5c233]/40 bg-white/90 px-4 py-2 text-sm font-medium text-[#b67b00]">
            返回社区
          </Link>

          <Surface className="mt-6 border-white/70 bg-white/92 p-5 shadow-[0_20px_50px_rgba(245,194,51,0.12)] sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <label className="flex h-14 flex-1 items-center gap-3 rounded-full border border-[#f5e8ca] bg-[#fffdf9] px-5">
                  <Search className="h-5 w-5 text-[#d8a33b]" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                    placeholder="搜索宠物生活、用户或内容"
                    className="w-full bg-transparent text-[15px] text-[#2e1a14] outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-14 rounded-full bg-[#f5c233] px-8 text-[15px] font-bold text-[#2e1a14]"
                >
                  搜索
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-8 border-b border-[#f3ead9] pb-3">
                {tabs.map((tab) => {
                  const active = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key)
                        router.replace(`/search?q=${encodeURIComponent(query)}&tab=${tab.key}`)
                      }}
                      className={['relative pb-2 text-[15px] font-semibold', active ? 'text-[#2e1a14]' : 'text-[#7f7269]'].join(' ')}
                    >
                      {tab.label} ({counts[tab.key]})
                      {active ? <span className="absolute inset-x-0 -bottom-[13px] h-[3px] rounded-full bg-[#f5c233]" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </Surface>

          {loading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
          ) : activeTab === 'topics' ? (
            <section className="mt-10">
              <SectionTitle icon={Hash} title="话题" />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.topics.map((topic) => (
                  <Surface key={topic.id} className="border-white/80 bg-white/94 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff3d3] text-[#d69900]">
                        <PawPrint className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[18px] font-bold text-[#2e1a14]">{topic.title}</p>
                        <p className="mt-1 text-[14px] text-[#8f8379]">{topic.description}</p>
                        <p className="mt-3 text-[13px] text-[#a39589]">{topic.views} 浏览  ·  {topic.discussions} 讨论</p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </section>
          ) : activeTab === 'users' ? (
            <section className="mt-10">
              <SectionTitle icon={Users} title="人" />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.users.map((user) => (
                  <Surface key={user.id} className="border-white/80 bg-white/94 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center gap-3">
                      <Link href={`/user/${user.id}`} className="h-14 w-14 overflow-hidden rounded-full bg-[#f5ead1]">
                        {user.avatarUrl ? (
                          <Image src={user.avatarUrl} alt={user.name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/user/${user.id}`} className="truncate text-[16px] font-bold text-[#2e1a14]">
                          {user.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-[#8f8379]">{user.bio}</p>
                        <p className="mt-2 text-[13px] text-[#a39589]">{user.postsCount} 内容  ·  {user.followersCount} 粉丝</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <FollowButton
                        userId={user.id}
                        initialFollowing={user.isFollowing}
                        initialFollowersCount={user.followersCount}
                      />
                    </div>
                  </Surface>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-10">
              <SectionTitle icon={FileText} title="内容" />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {data.content.map((item) => (
                  <Link key={item.id} href={`/content/${item.id}`}>
                    <Surface className="overflow-hidden border-white/80 bg-white/94 p-0 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                      <div className="relative aspect-[4/3] bg-[#f5efe6]">
                        {item.mediaImages?.[0] || item.mediaSrc ? (
                          <Image
                            src={item.mediaImages?.[0] || item.mediaSrc || ''}
                            alt={item.title || '内容封面'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="px-4 py-4">
                        <p className="line-clamp-2 text-[15px] font-semibold text-[#2e1a14]">{item.title || item.content}</p>
                        <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[#8f8379]">{item.content}</p>
                        <p className="mt-3 text-[12px] text-[#a39589]">{item.author}</p>
                      </div>
                    </Surface>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Hash; title: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[#2e1a14]">
        <Icon className="h-5 w-5 text-[#c79216]" />
        <h2 className="text-[24px] font-black">{title}</h2>
      </div>
    </div>
  )
}
