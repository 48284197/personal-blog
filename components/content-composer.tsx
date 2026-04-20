'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ImagePlus, PlaySquare, Video } from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { FileUploader } from '@/components/comments/file-uploader'
import { type ContentItem, type ContentMediaType } from '@/lib/site-data'
import { cn } from '@/lib/utils'

type ContentComposerProps = {
  open: boolean
  onClose: () => void
  onPublished: (item: ContentItem) => void
}

type AuthProfile = {
  name: string
  email: string
  avatarUrl?: string | null
}

type DraftState = {
  topic: string
  mediaType: ContentMediaType
  title: string
  summary: string
  mediaOrientation: 'horizontal' | 'vertical'
  mediaImages: string[]
  mediaSrc: string
  mediaAudio: string
  mediaCover: string
  mediaDuration: string
}

const mediaOptions: Array<{
  key: ContentMediaType
  label: string
  icon: typeof PlaySquare
  desc: string
}> = [
  { key: 'image', label: '图片', icon: ImagePlus, desc: '适合照片、截图、海报' },
  { key: 'video', label: '视频', icon: Video, desc: '适合短视频、记录片段' },
]

function createDefaultDraft(): DraftState {
  return {
    topic: '',
    mediaType: 'image',
    title: '',
    summary: '',
    mediaOrientation: 'horizontal',
    mediaImages: [],
    mediaSrc: '',
    mediaAudio: '',
    mediaCover: '',
    mediaDuration: '03:00',
  }
}

export function ContentComposer({ open, onClose, onPublished }: ContentComposerProps) {
  const [draft, setDraft] = useState<DraftState>(createDefaultDraft)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [videoMetadata, setVideoMetadata] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!open) return

    setDraft(createDefaultDraft())
    setError('')
    setLoading(false)
    setAuthProfile(null)
    setAuthLoaded(false)
    setVideoMetadata(null)

    // 禁止背景滚动
    const originalOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    let cancelled = false

    const loadAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) {
          if (!cancelled) setAuthLoaded(true)
          return
        }

        const data = (await response.json()) as { user?: AuthProfile }
        if (!cancelled) {
          setAuthProfile(data.user ?? null)
          setAuthLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setAuthProfile(null)
          setAuthLoaded(true)
        }
      }
    }

    void loadAuth()

    return () => {
      cancelled = true
      document.documentElement.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const updateDraft = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  // 处理视频上传，自动检测方向
  const handleVideoUpload = (urls: string[]) => {
    if (urls.length > 0) {
      const videoUrl = urls[0]
      updateDraft('mediaSrc', videoUrl)

      // 创建视频元素来获取尺寸
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        const metadata = { width: video.videoWidth, height: video.videoHeight }
        setVideoMetadata(metadata)
        const orientation = metadata.height > metadata.width ? 'vertical' : 'horizontal'
        updateDraft('mediaOrientation', orientation)
      }
      video.src = videoUrl
    }
  }
  const publishDisabled = useMemo(() => {
    const hasMedia =
      draft.mediaType === 'image'
        ? draft.mediaImages.length > 0
        : draft.mediaType === 'video'
          ? Boolean(draft.mediaSrc.trim())
          : false

    return loading || !hasMedia
  }, [draft.mediaImages.length, draft.mediaSrc, draft.mediaType, loading])

  const handlePublish = async () => {
    if (publishDisabled) return
    setLoading(true)
    setError('')

    const topic = `内容-${Date.now()}`
    const payload = {
      topic,
      title: draft.summary.trim() || topic,
      summary: draft.summary.trim() || topic,
      mediaType: draft.mediaType,
      mediaOrientation: draft.mediaType === 'video' ? draft.mediaOrientation : undefined,
      mediaLabel: topic,
      mediaDetail: draft.summary.trim() || topic,
      mediaImages: draft.mediaType === 'image' ? draft.mediaImages : undefined,
      mediaSrc:
        draft.mediaType === 'video'
          ? draft.mediaSrc.trim() || undefined
          : draft.mediaType === 'image'
            ? draft.mediaImages[0]
            : undefined,
      tags: [],
    }

    try {
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
        onPublished(data.item)
        onClose()
      }
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : '发布失败，请稍后重试。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        aria-label="关闭发布面板"
        onClick={onClose}
        className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"
      />

      <Surface className="relative z-10 w-full max-w-2xl h-screen overflow-hidden border-white/70 bg-white/96 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.18)] flex flex-col">
        <div className="border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <Badge tone="emerald">发内容</Badge>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">发布一条内容</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5 max-w-lg">
            {/* 正文 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">正文</label>
              <textarea
                value={draft.summary}
                onChange={(event) => updateDraft('summary', event.target.value)}
                placeholder="写下你想发出的内容..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* 内容形式 */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">内容形式 *</p>
              <div className="grid gap-2 grid-cols-2">
                {mediaOptions.map((option) => {
                  const Icon = option.icon
                  const active = option.key === draft.mediaType
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => updateDraft('mediaType', option.key)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left transition',
                        active
                          ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{option.label}</p>
                          <p className="text-xs text-slate-500">{option.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 登录状态 */}
            {authLoaded ? (
              authProfile ? null : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  未登录，发布后账号归属不会写入平台。{' '}
                  <Link href="/login" className="underline">
                    去登录
                  </Link>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                检查登录状态中...
              </div>
            )}

            {/* 媒体上传 */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                {draft.mediaType === 'image' ? '上传图片' : '上传视频'} *
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                {draft.mediaType === 'image' ? (
                  <FileUploader
                    accept="image/*"
                    multiple
                    value={draft.mediaImages}
                    onChange={(urls) => updateDraft('mediaImages', urls)}
                    buttonLabel="选择图片"
                    helperText="支持多张，最大 20MB"
                    previewMode="image"
                    maxSize={20 * 1024 * 1024}
                    maxFiles={10}
                  />
                ) : null}

                {draft.mediaType === 'video' ? (
                  <FileUploader
                    accept="video/*"
                    multiple={false}
                    value={draft.mediaSrc ? [draft.mediaSrc] : []}
                    onChange={handleVideoUpload}
                    buttonLabel="选择视频"
                    helperText="最大 100MB，自动检测方向"
                    previewMode="chip"
                    maxSize={100 * 1024 * 1024}
                  />
                ) : null}
              </div>
            </div>

            {/* 错误提示 */}
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex-shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishDisabled}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '发布中...' : '立即发布'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </Surface>
    </div>
  )
}
