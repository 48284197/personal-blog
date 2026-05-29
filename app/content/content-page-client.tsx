'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeHelp,
  BookOpen,
  Hash,
  Home,
  ImagePlus,
  Loader2,
  ScrollText,
  Video,
  X,
} from 'lucide-react'
import { ContentFeed } from '@/components/content-feed'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'
import { useCommentSheet } from '@/components/comment-sheet'
import { FollowButton } from '@/components/follow-button'
import type { ContentItem, ContentChannelKey } from '@/lib/site-data'

type ContentPageClientProps = {
  initialItems: ContentItem[]
  initialHasMore: boolean
}

type AuthProfile = {
  name: string
  email: string
  avatarUrl?: string | null
}

type SidebarState = {
  hotTopics: Array<{ title: string; count: number; hot: boolean; displayCount: string }>
  suggestedUsers: Array<{ id: string; name: string; fans: string; avatarUrl: string; bio: string; followersCount: number; isFollowing: boolean }>
  activities: Array<{ id: string; title: string; time: string; avatarUrl: string }>
}

type ChannelTab = {
  key: ContentChannelKey | ''
  label: string
  icon: typeof Home
  followingOnly?: boolean
  publishTag?: string
}

const CHANNEL_TABS: ChannelTab[] = [
  { key: '', label: '推荐', icon: Home },
  { key: '', label: '关注', icon: Hash, followingOnly: true },
  { key: 'daily', label: '日常', icon: ImagePlus, publishTag: '日常' },
  { key: 'knowledge', label: '养宠知识', icon: BookOpen, publishTag: '养宠知识' },
  { key: 'question', label: '求助问答', icon: BadgeHelp, publishTag: '求助问答' },
  { key: 'story', label: '萌宠故事', icon: ScrollText, publishTag: '萌宠故事' },
]


function formatFansCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function formatTopicCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万讨论'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k讨论'
  return n + '讨论'
}

async function uploadFiles(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? '上传失败')
  }

  const data = (await response.json()) as { files?: Array<{ url: string }> }
  return data.files?.map((file) => file.url).filter(Boolean) ?? []
}

export function ContentPageClient({ initialItems, initialHasMore }: ContentPageClientProps) {
  const [feedVersion, setFeedVersion] = useState(0)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState<ContentChannelKey | ''>('')
  const [followingOnly, setFollowingOnly] = useState(false)
  const [sidebar, setSidebar] = useState<SidebarState | null>(null)
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const { isOpen } = useCommentSheet()

  // 加载侧栏数据
  useEffect(() => {
    let cancelled = false
    setSidebarLoading(true)

    const loadSidebar = async () => {
      try {
        const res = await fetch('/api/feed/sidebar')
        if (!res.ok) {
          if (!cancelled) setSidebarLoading(false)
          return
        }
        const data = await res.json()
        if (cancelled) return

        setSidebar({
          hotTopics: (data.hotTopics ?? []).map((t: { title: string; count: number; hot: boolean }) => ({
            title: t.title,
            count: t.count,
            hot: t.hot,
            displayCount: formatTopicCount(t.count),
          })),
          suggestedUsers: (data.suggestedUsers ?? []).map((u: { id: string; name: string; fans: number; avatarUrl: string; bio?: string; followersCount?: number; isFollowing?: boolean }) => ({
            id: u.id,
            name: u.name,
            fans: formatFansCount(u.fans),
            avatarUrl: u.avatarUrl,
            bio: u.bio ?? '',
            followersCount: u.followersCount ?? 0,
            isFollowing: Boolean(u.isFollowing),
          })),
          activities: (data.activities ?? []).slice(0, 10).map((a: { id: string; title: string; time: string; avatarUrl: string }) => ({
            id: a.id,
            title: a.title,
            time: a.time,
            avatarUrl: a.avatarUrl,
          })),
        })
      } catch {
        // 保持默认空状态
      } finally {
        if (!cancelled) setSidebarLoading(false)
      }
    }

    void loadSidebar()
    return () => { cancelled = true }
  }, [])

  const handleChannelChange = (tab: ChannelTab) => {
    setActiveChannel(tab.key)
    setFollowingOnly(Boolean(tab.followingOnly))
  }

  const dynamicTopicSuggestions = useMemo(() => {
    return sidebar?.hotTopics.map((topic) => topic.title) ?? []
  }, [sidebar])
  const showHotTopics = sidebarLoading || Boolean(sidebar?.hotTopics.length)
  const showSuggestedUsers = sidebarLoading || Boolean(sidebar?.suggestedUsers.length)
  const showActivities = sidebarLoading || Boolean(sidebar?.activities.length)

  return (
    <main className="relative min-h-screen bg-[#f6f4f2]">
      <Navbar
        activeLabel="社区"
        showPublish
        publishHref="/content"
        onPublishClick={() => setIsComposerOpen(true)}
      />

      {/* 提示：当详情页评论区打开时导航栏样式需保持 */}
      <div className="relative mx-auto max-w-[1520px] px-4 pt-[138px] sm:px-6 sm:pt-[142px] xl:px-10 xl:pt-[96px]">
        <div className="flex items-start gap-8">
          {/* 左侧导航 */}
          <aside className="sticky top-[96px] hidden w-[200px] shrink-0 xl:block">
            <nav className="space-y-1">
              {CHANNEL_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeChannel === tab.key && followingOnly === Boolean(tab.followingOnly)
                return (
                  <button
                    key={tab.key || 'all'}
                    type="button"
                    onClick={() => handleChannelChange(tab)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition',
                      isActive
                        ? 'bg-[#f5c233]/15 text-[#2e1a14] font-bold'
                        : 'text-[#65584f] hover:bg-black/5',
                    ].join(' ')}
                  >
                    <span className={isActive ? 'text-[#f5c233]' : 'text-[#8f8379]'}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* 中间内容区 */}
          <section className="min-w-0 flex-1">
            {/* 频道与发布工具栏（移动端 / iPad） */}
            <div className="mb-4 flex items-center gap-3 xl:hidden">
              <div className="min-w-0 flex-1 overflow-x-auto pb-2">
                <div className="flex w-max gap-2 pr-1">
                  {CHANNEL_TABS.map((tab) => {
                    const isActive = activeChannel === tab.key
                      && followingOnly === Boolean(tab.followingOnly)
                    return (
                      <button
                        key={tab.key || 'all'}
                        type="button"
                        onClick={() => handleChannelChange(tab)}
                        className={[
                          'shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition whitespace-nowrap',
                          isActive
                            ? 'bg-[#f5c233] text-[#2e1a14] font-bold'
                            : 'border border-black/5 bg-white/80 text-[#65584f]',
                        ].join(' ')}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            
            </div>

            <ContentFeed
              refreshKey={feedVersion}
              initialItems={initialItems}
              initialHasMore={initialHasMore}
              channel={activeChannel}
              followingOnly={followingOnly}
            />
          </section>

          {/* 右侧栏 */}
          <aside className="sticky top-[96px] hidden w-[320px] shrink-0 xl:block space-y-6">
            {/* 热门话题 */}
            {showHotTopics ? (
            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#1f140f]">热门话题</h3>
              </div>

              <div className="mt-5 space-y-4">
                {sidebarLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                  </div>
                ) : sidebar?.hotTopics.length ? (
                  sidebar.hotTopics.map((topic, index) => (
                    <div key={topic.title} className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                            index < 3 ? 'bg-[#fff0c6] text-[#d69200]' : 'bg-[#f4efe7] text-[#8c837a]',
                          ].join(' ')}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-[#2e1a14]">
                            {topic.title}
                            {topic.hot ? (
                              <span className="ml-2 rounded-full bg-[#ffe3d8] px-2 py-0.5 text-[11px] font-semibold text-[#ff5a3a]">
                                热
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[14px] text-[#8f8379]">{topic.displayCount}</span>
                    </div>
                  ))
                ) : null}
              </div>
            </Surface>
            ) : null}

            {/* 推荐用户 */}
            {showSuggestedUsers ? (
            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#1f140f]">推荐用户</h3>
              </div>

              <div className="mt-5 space-y-4">
                {sidebarLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                  </div>
                ) : sidebar?.suggestedUsers.length ? (
                  sidebar.suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Link href={`/user/${user.id}`} className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#cdb79f]">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                              {user.name.slice(0, 1)}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/user/${user.id}`} className="truncate text-[15px] font-medium text-[#2e1a14]">
                            {user.name}
                          </Link>
                          <p className="line-clamp-1 text-[13px] text-[#8f8379]">{user.bio || '这个用户还没有填写简介'}</p>
                          <p className="text-[13px] text-[#a39a90]">粉丝 {user.followersCount} · 贡献 {user.fans}</p>
                        </div>
                      </div>
                      <FollowButton
                        userId={user.id}
                        initialFollowing={user.isFollowing}
                        initialFollowersCount={user.followersCount}
                        size="sm"
                        showCount={false}
                      />
                    </div>
                  ))
                ) : null}
              </div>
            </Surface>
            ) : null}

            {/* 热门动态 */}
            {showActivities ? (
            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <h3 className="text-[18px] font-black text-[#1f140f]">热门动态</h3>

              <div className="mt-5 space-y-4">
                {sidebarLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                  </div>
                ) : sidebar?.activities.length ? (
                  sidebar.activities.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#cdb79f]">
                          {item.avatarUrl ? (
                            <Image
                              src={item.avatarUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                              宠
                            </div>
                          )}
                        </div>
                        <p className="truncate text-[14px] text-[#2e1a14]">{item.title}</p>
                      </div>
                      <span className="shrink-0 text-[13px] text-[#a39a90]">{item.time}</span>
                    </div>
                  ))
                ) : null}
              </div>
            </Surface>
            ) : null}
          </aside>
        </div>
      </div>

      {/* 发布弹窗 */}
      {isComposerOpen ? (
        <ComposerModal
          channel={activeChannel}
          followingOnly={followingOnly}
          topicSuggestions={dynamicTopicSuggestions}
          onClose={() => setIsComposerOpen(false)}
          onPublished={() => {
            setFeedVersion((v) => v + 1)
            setIsComposerOpen(false)
          }}
        />
      ) : null}

      <style jsx global>{`
        ${isOpen ? '.navbar-blur { filter: blur(4px); pointer-events: none; }' : ''}
      `}</style>
    </main>
  )
}

// ========= 发布弹窗组件 =========

type ComposerModalProps = {
  channel: ContentChannelKey | ''
  followingOnly: boolean
  topicSuggestions: string[]
  onClose: () => void
  onPublished: () => void
}

function ComposerModal({ channel, followingOnly, topicSuggestions, onClose, onPublished }: ComposerModalProps) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [videoName, setVideoName] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const loadAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setAuthProfile(data.user ?? null)
        }
      } catch {
        // ignore
      } finally {
        setAuthLoaded(true)
      }
    }

    void loadAuth()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    setError('')
    try {
      const urls = await uploadFiles(Array.from(files))
      setImages(prev => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    const [file] = Array.from(files)
    setUploading(true)
    setError('')

    try {
      const [uploadedUrl] = await uploadFiles([file])
      if (!uploadedUrl) {
        throw new Error('视频上传失败')
      }

      setVideoUrl(uploadedUrl)
      setVideoName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
    setTagInput('')
  }

  const handlePublish = async () => {
    const trimmed = content.trim()
    if (!trimmed) {
      setError('请输入内容')
      return
    }

    setPublishing(true)
    setError('')

    try {
      const mediaType = videoUrl ? 'video' : images.length > 0 ? 'image' : 'text'
      const publishChannel = channel || (followingOnly ? 'daily' : 'daily')
      const publishTab = CHANNEL_TABS.find((tab) => tab.key === publishChannel && !tab.followingOnly)
      const normalizedTags = publishTab?.publishTag && !tags.includes(publishTab.publishTag)
        ? [publishTab.publishTag, ...tags]
        : tags
      const payload = {
        channel: publishChannel,
        mediaType,
        mediaSrc: videoUrl || images[0] || undefined,
        mediaImages: images.length ? images : undefined,
        content: trimmed,
        tags: normalizedTags,
      }

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message ?? '发布失败')
      }

      await res.json()
      onPublished()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm pt-[10vh] pb-10">
      <div className="relative w-full max-w-lg rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-[17px] font-bold text-[#2e1a14]">发布新内容</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 文字内容 */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的萌宠日常..."
            className="w-full min-h-[120px] resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-[15px] leading-relaxed text-[#2e1a14] outline-none placeholder:text-slate-400 focus:border-[#f5c233] focus:bg-white transition"
          />

          {/* 图片预览 */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewImage(url)}
                  className="group relative aspect-square overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50"
                >
                  <Image src={url} alt="" fill className="object-cover transition duration-200 group-hover:scale-[1.03]" unoptimized />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-left text-[12px] text-white opacity-0 transition group-hover:opacity-100">
                    点击查看大图
                  </div>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation()
                      setImages(prev => prev.filter((_, j) => j !== i))
                    }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white text-[11px]"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {videoUrl ? (
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#2e1a14]">
                    <Video className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{videoName || '已上传视频'}</span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-slate-500">{videoUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl('')
                    setVideoName('')
                  }}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
                  aria-label="移除视频"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <video
                src={videoUrl}
                controls
                className="mt-3 max-h-56 w-full rounded-[12px] bg-black object-contain"
              />
            </div>
          ) : null}

          {/* 上传按钮 */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? '上传中...' : '添加图片'}
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Video className="h-4 w-4" />
              {uploading && !videoUrl ? '上传中...' : '上传视频'}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          </div>

          {topicSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topicSuggestions.slice(0, 6).map((topic) => {
                const normalized = topic.replace(/^#/, '')
                const selected = tags.includes(normalized)

                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setTags((current) =>
                        selected
                          ? current.filter((tag) => tag !== normalized)
                          : [...current, normalized]
                      )
                    }}
                    className={[
                      'rounded-full px-3 py-1 text-[12px] font-medium transition',
                      selected
                        ? 'bg-[#fff0c6] text-[#d69200]'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    #{normalized}
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* 标签 */}
          <div className="flex flex-wrap items-center gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff0c6] px-3 py-1 text-[13px] font-medium text-[#d69200]"
              >
                #{tag}
                <span className="text-[10px]">×</span>
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="添加标签"
                className="w-20 border-0 bg-transparent text-[13px] text-slate-500 outline-none placeholder:text-slate-400"
              />
              {tagInput ? (
                <button type="button" onClick={handleAddTag} className="text-[12px] text-[#f5c233] font-bold">+</button>
              ) : null}
            </div>
          </div>

          {/* 登录提示 */}
          {authLoaded && !authProfile ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-700">
              未登录，发布后不会关联你的账号。{' '}
              <Link href="/login" className="underline font-medium">去登录</Link>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || !content.trim()}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#f5c233] px-5 py-2.5 text-[14px] font-bold text-[#2e1a14] shadow-[0_8px_18px_rgba(245,194,51,0.2)] transition hover:bg-[#efba18] disabled:opacity-50"
          >
            {publishing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> 发布中</>
            ) : (
              '发布'
            )}
          </button>
        </div>
      </div>

      {previewImage ? (
        <button
          type="button"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          aria-label="关闭图片预览"
        >
          <div className="relative h-[min(78vh,760px)] w-[min(92vw,760px)] overflow-hidden rounded-[20px] bg-black shadow-2xl">
            <Image src={previewImage} alt="图片预览" fill className="object-contain" unoptimized />
          </div>
        </button>
      ) : null}
    </div>
  )
}
