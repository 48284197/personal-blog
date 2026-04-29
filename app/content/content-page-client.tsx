'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  CirclePlus,
  Compass,
  Flame,
  Hash,
  Home,
  ImagePlus,
  Loader2,
  MapPin,
  Megaphone,
  PawPrint,
  Plus,
  Rss,
  Video,
} from 'lucide-react'
import { ContentFeed } from '@/components/content-feed'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'
import { useCommentSheet } from '@/components/comment-sheet'
import type { ContentItem } from '@/lib/site-data'

type ContentPageClientProps = {
  initialItems: ContentItem[]
  initialHasMore: boolean
}

type AuthProfile = {
  name: string
  email: string
  avatarUrl?: string | null
}

type DraftState = {
  content: string
  images: string[]
  video: string
  topics: string[]
}

const leftNavItems = [
  { label: '推荐', icon: Home, active: true },
  { label: '关注', icon: PawPrint },
  { label: '最新', icon: Flame },
  { label: '话题', icon: Hash },
  { label: '附近', icon: MapPin },
  { label: '萌宠日常', icon: CirclePlus },
  { label: '狗狗专区', icon: PawPrint },
  { label: '猫咪专区', icon: Rss },
  { label: '小宠专区', icon: Compass },
]

const hotTopics = [
  { title: '春天和宠物的100种合影', count: '2.5万讨论', hot: true },
  { title: '我家毛孩子的迷惑行为', count: '1.8万讨论', hot: true },
  { title: '新手养宠必备清单', count: '1.2万讨论', hot: false },
  { title: '宠物的治愈瞬间', count: '9876讨论', hot: false },
  { title: '你家宠物最爱吃什么', count: '8765讨论', hot: false },
]

const suggestedUsers = [
  { name: '金毛小太阳', fans: '2.3万', avatar: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=256&q=80' },
  { name: '奶茶是只猫', fans: '1.8万', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1f?auto=format&fit=crop&w=256&q=80' },
  { name: '柯基小元气', fans: '1.2万', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80' },
  { name: '兔兔那么可爱', fans: '9867', avatar: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=256&q=80' },
]

const activityItems = [
  { title: '毛球妈妈 赞了你的评论', time: '2 分钟前', avatar: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=128&q=80' },
  { title: '软糖是只猫 发布了新动态', time: '10 分钟前', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1f?auto=format&fit=crop&w=128&q=80' },
  { title: '金毛小太阳 关注了你', time: '30 分钟前', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=128&q=80' },
]

const topicSuggestions = hotTopics.map((item) => item.title)

function createDefaultDraft(): DraftState {
  return {
    content: '',
    images: [],
    video: '',
    topics: [],
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function appendTopic(content: string, topic: string) {
  const cleanTopic = topic.replace(/^#/, '').trim()
  if (!cleanTopic) return content

  const hashtag = `#${cleanTopic}`
  const trimmed = content.trimEnd()
  if (!trimmed) return hashtag
  if (new RegExp(`(^|\\s)${escapeRegExp(hashtag)}(\\s|$)`).test(trimmed)) return trimmed
  return `${trimmed} ${hashtag}`.trim()
}

function removeTopic(content: string, topic: string) {
  const hashtag = `#${topic.replace(/^#/, '').trim()}`
  const pattern = new RegExp(`(?:\\s|^)${escapeRegExp(hashtag)}(?=\\s|$)`, 'g')
  return content.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
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
  const [feedItems, setFeedItems] = useState(initialItems)
  const [feedHasMore, setFeedHasMore] = useState(initialHasMore)
  const [feedVersion, setFeedVersion] = useState(0)
  const [draft, setDraft] = useState(createDefaultDraft)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [showTopics, setShowTopics] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const { isOpen } = useCommentSheet()

  useEffect(() => {
    setFeedItems(initialItems)
    setFeedHasMore(initialHasMore)
  }, [initialItems, initialHasMore, feedVersion])

  useEffect(() => {
    let cancelled = false

    const loadAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { user?: AuthProfile }
        if (!cancelled) {
          setAuthProfile(data.user ?? null)
        }
      } catch {
        if (!cancelled) {
          setAuthProfile(null)
        }
      }
    }

    void loadAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const publishDisabled = useMemo(() => {
    if (publishing) return true
    return !draft.content.trim() && draft.images.length === 0 && !draft.video.trim()
  }, [draft.content, draft.images.length, draft.video, publishing])

  const openImagePicker = () => {
    if (!isComposerOpen) setIsComposerOpen(true)
    imageInputRef.current?.click()
  }

  const openVideoPicker = () => {
    if (!isComposerOpen) setIsComposerOpen(true)
    videoInputRef.current?.click()
  }

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setUploading(true)
    setUploadError('')
    try {
      const urls = await uploadFiles(files)
      if (urls.length > 0) {
        setDraft((current) => ({ ...current, images: [...current.images, ...urls] }))
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleVideoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setUploading(true)
    setUploadError('')
    try {
      const urls = await uploadFiles(files)
      if (urls[0]) {
        setDraft((current) => ({ ...current, video: urls[0] }))
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const toggleTopic = (topic: string) => {
    setDraft((current) => {
      const selected = current.topics.includes(topic)
      return {
        ...current,
        topics: selected ? current.topics.filter((item) => item !== topic) : [...current.topics, topic],
        content: selected ? removeTopic(current.content, topic) : appendTopic(current.content, topic),
      }
    })
  }

  const removeImage = (index: number) => {
    setDraft((current) => ({
      ...current,
      images: current.images.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const handlePublish = async () => {
    if (publishDisabled) return
    setPublishing(true)
    setPublishError('')

    try {
      const summary = draft.content.trim()
      const mediaType = draft.video.trim() ? 'video' : draft.images.length > 0 ? 'image' : 'text'

      const payload = {
        channel: 'discussion' as const,
        topic: summary.slice(0, 24) || '毛球社区',
        title: summary.slice(0, 32) || '毛球社区新动态',
        summary,
        mediaType,
        mediaOrientation: mediaType === 'video' ? 'horizontal' : undefined,
        mediaDetail: summary || undefined,
        mediaImages: mediaType === 'image' ? draft.images : undefined,
        mediaSrc: mediaType === 'video' ? draft.video || undefined : draft.images[0],
        tags: draft.topics.length > 0 ? draft.topics : ['毛球'],
      }

      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? '发布失败，请稍后重试。')
      }

      const data = (await response.json()) as { item?: ContentItem }
      if (data.item) {
        setFeedItems((current) => [data.item!, ...current])
        setFeedVersion((current) => current + 1)
        setDraft(createDefaultDraft())
        setShowTopics(false)
        setIsComposerOpen(false)
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : '发布失败，请稍后重试。')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf4e8] text-[#2e1a14]">
      <Navbar
        activeLabel="社区"
        showPublish
        publishHref="#quick-publish"
        userAvatarSrc={
          authProfile?.avatarUrl ??
          'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=128&q=80'
        }
        userName={authProfile?.name ?? '毛球'}
      />

      <div className="relative mx-auto max-w-[1520px] px-4 pb-8 pt-[90px] sm:px-6 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)_360px]">
          <aside className="hidden xl:block">
            <div className="sticky top-[94px] space-y-6">
              <Surface className="overflow-hidden border-white/80 bg-white/90 p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="space-y-1 p-4">
                  {leftNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={[
                          'flex w-full items-center gap-4 rounded-[18px] px-4 py-4 text-[16px] font-semibold transition',
                          item.active
                            ? 'bg-[#f5c233] text-[#2e1a14] shadow-[0_10px_20px_rgba(245,194,51,0.14)]'
                            : 'text-[#2f1c16] hover:bg-[#faf6ef]',
                        ].join(' ')}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </Surface>

              <Surface className="overflow-hidden border-[#f4e3bf] bg-[linear-gradient(180deg,#fff7df_0%,#fffdf7_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                <div className="text-center">
                  <p className="text-[18px] font-black leading-8 tracking-[-0.04em] text-[#2e1a14]">
                    分享萌宠生活
                    <br />
                    记录美好瞬间
                  </p>
                </div>

                <div className="mt-6 flex h-[140px] items-end justify-center overflow-hidden rounded-[22px] bg-gradient-to-b from-[#fff6da] to-[#fffef9]">
                  <div className="relative h-[128px] w-[154px]">
                    <Image
                      src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&q=80"
                      alt="宠物插画"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(true)
                    document.getElementById('quick-publish')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5c233] text-[15px] font-semibold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.22)] transition hover:bg-[#efba18]"
                >
                  <Plus className="h-4 w-4" />
                  快捷发布
                </button>
              </Surface>
            </div>
          </aside>

          <section className={['space-y-6 transition-transform duration-300', isOpen ? 'scale-[0.98]' : 'scale-100'].join(' ')}>
            <div id="quick-publish">
              <Surface className="overflow-hidden border-white/80 bg-white/92 p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                {isComposerOpen ? (
                  <div className="px-5 py-5 sm:px-6">
                    <div className="flex items-start gap-4">
                      <Image
                        src={
                          authProfile?.avatarUrl ??
                          'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=128&q=80'
                        }
                        alt="头像"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                        unoptimized
                      />

                      <div className="relative flex-1">
                        <textarea
                          value={draft.content}
                          onChange={(event) => {
                            setDraft((current) => ({ ...current, content: event.target.value }))
                            setPublishError('')
                          }}
                          placeholder="有什么新鲜事想告诉大家？"
                          rows={3}
                          className={[
                            'min-h-[160px] w-full resize-none rounded-[24px] border border-black/5 bg-[#fbfaf7] px-5 py-4 pb-24 text-[15px] leading-7 text-[#2e1a14] outline-none transition placeholder:text-[#a39a90] focus:border-[#f5c233] focus:bg-white focus:ring-4 focus:ring-[#f5c233]/15',
                            showTopics ? 'pb-28' : '',
                          ].join(' ')}
                        />

                        {(draft.images.length > 0 || draft.video) && (
                          <div className="absolute inset-x-4 bottom-4">
                            <div className="flex items-end gap-2 overflow-x-auto rounded-[18px] border border-black/5 bg-white/90 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)] backdrop-blur-sm">
                              {draft.images.length > 0 ? (
                                draft.images.map((image, index) => (
                                  <button
                                    key={image}
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] bg-[#faf7f2]"
                                    aria-label="移除图片"
                                  >
                                    <Image src={image} alt="已上传图片" fill className="object-cover" unoptimized />
                                    <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/60 text-[9px] text-white opacity-0 transition group-hover:opacity-100">
                                      ×
                                    </span>
                                  </button>
                                ))
                              ) : null}

                              {draft.video ? (
                                <button
                                  type="button"
                                  onClick={() => setDraft((current) => ({ ...current, video: '' }))}
                                  className="group relative flex h-10 min-w-[120px] items-center gap-2 overflow-hidden rounded-[12px] bg-[#faf7f2] px-2"
                                  aria-label="移除视频"
                                >
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff0c8] text-[#2e1a14]">
                                    <Video className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="min-w-0 truncate text-[11px] text-[#5f5348]">视频</span>
                                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/60 text-[9px] text-white opacity-0 transition group-hover:opacity-100">
                                    ×
                                  </span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={openImagePicker}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#faf7f2] px-4 text-[14px] font-medium text-[#5f5348] transition hover:bg-[#f5f1ea]"
                        >
                          <ImagePlus className="h-4 w-4" />
                          图片
                        </button>

                        <button
                          type="button"
                          onClick={openVideoPicker}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#faf7f2] px-4 text-[14px] font-medium text-[#5f5348] transition hover:bg-[#f5f1ea]"
                        >
                          <Video className="h-4 w-4" />
                          视频
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowTopics((current) => !current)}
                          className={[
                            'inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition',
                            showTopics
                              ? 'bg-[#fff0c8] text-[#2e1a14]'
                              : 'bg-[#faf7f2] text-[#5f5348] hover:bg-[#f5f1ea]',
                          ].join(' ')}
                        >
                          <Megaphone className="h-4 w-4" />
                          话题
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishDisabled}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#f5c233] px-7 text-[15px] font-semibold text-[#2e1a14] shadow-[0_10px_22px_rgba(245,194,51,0.2)] transition hover:bg-[#efba18] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {publishing ? '发布中...' : '发布'}
                      </button>
                    </div>

                    {showTopics ? (
                      <div className="mt-4 rounded-[24px] border border-black/5 bg-[#fffdf8] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[14px] font-semibold text-[#1f140f]">热门话题</p>
                          <button
                            type="button"
                            onClick={() => setShowTopics(false)}
                            className="text-[13px] text-[#8f8379] transition hover:text-[#2e1a14]"
                          >
                            收起
                          </button>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {topicSuggestions.map((topic) => {
                            const active = draft.topics.includes(topic)

                            return (
                              <button
                                key={topic}
                                type="button"
                                onClick={() => toggleTopic(topic)}
                                className={[
                                  'flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition',
                                  active
                                    ? 'border-[#f5c233] bg-[#fff3c9] text-[#2e1a14]'
                                    : 'border-black/5 bg-white text-[#2e1a14] hover:bg-[#faf7f2]',
                                ].join(' ')}
                              >
                                <span className="text-[14px] font-medium">#{topic}</span>
                                <span
                                  className={[
                                    'flex h-5 w-5 items-center justify-center rounded-full text-[12px]',
                                    active ? 'bg-[#f5c233] text-[#2e1a14]' : 'bg-[#f4efe7] text-[#8c837a]',
                                  ].join(' ')}
                                >
                                  {active ? '✓' : '+'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {uploadError ? (
                      <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
                        {uploadError}
                      </div>
                    ) : null}

                    {publishError ? (
                      <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
                        {publishError}
                      </div>
                    ) : null}

                    <div className="mt-4 text-[13px] text-[#8f8379]">
                      {uploading ? '上传中...' : '点击图片/视频即可直接上传'}
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelected}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoSelected}
                    />
                  </div>
                ) : (
                  <div className="px-5 py-5 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      className="flex min-h-[76px] w-full items-center gap-4 rounded-[28px] border border-black/5 bg-[#fbfaf7] px-5 text-left transition hover:bg-[#f6f2eb] focus:outline-none focus:ring-4 focus:ring-[#f5c233]/15"
                    >
                      <Image
                        src={
                          authProfile?.avatarUrl ??
                          'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=128&q=80'
                        }
                        alt="头像"
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                        unoptimized
                      />

                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-medium text-[#a39a90]">
                          有什么新鲜事想告诉大家？
                        </span>
                        <span className="mt-1 block text-[13px] text-[#c0b7ad]">我也要分享</span>
                      </span>
                    </button>
                  </div>
                )}
              </Surface>
            </div>

            <ContentFeed refreshKey={feedVersion} initialItems={feedItems} initialHasMore={feedHasMore} />
          </section>

          <aside className="space-y-6">
            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#1f140f]">热门话题</h3>
                <Link href="#" className="inline-flex items-center gap-1 text-[14px] text-[#8f8379]">
                  查看更多
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {hotTopics.map((topic, index) => (
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
                    <span className="shrink-0 text-[14px] text-[#8f8379]">{topic.count}</span>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#1f140f]">推荐用户</h3>
                <Link href="#" className="inline-flex items-center gap-1 text-[14px] text-[#8f8379]">
                  查看更多
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {suggestedUsers.map((user) => (
                  <div key={user.name} className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                        unoptimized
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-[#2e1a14]">{user.name}</p>
                        <p className="text-[13px] text-[#8f8379]">粉丝 {user.fans}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-full border border-[#f5c233] px-4 text-[14px] font-semibold text-[#f39a00]"
                    >
                      + 关注
                    </button>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="overflow-hidden border-white/80 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <h3 className="text-[18px] font-black text-[#1f140f]">热门动态</h3>

              <div className="mt-5 space-y-4">
                {activityItems.map((item) => (
                  <div key={item.title} className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src={item.avatar}
                        alt={item.title}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                        unoptimized
                      />
                      <p className="truncate text-[14px] text-[#2e1a14]">{item.title}</p>
                    </div>
                    <span className="shrink-0 text-[13px] text-[#a39a90]">{item.time}</span>
                  </div>
                ))}
              </div>
            </Surface>
          </aside>
        </div>
      </div>
    </main>
  )
}
