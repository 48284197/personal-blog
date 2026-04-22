'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Play, Pause } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface, Badge } from '@/components/landing'
import { UserAvatar } from '@/components/user-card'
import { MediaGallery } from '@/components/media-gallery'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { ContentItem, CommentItem } from '@/lib/site-data'

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [content, setContent] = useState<ContentItem | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [likeState, setLikeState] = useState<{ liked: boolean; likes: number } | null>(null)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  // 获取内容详情
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/api/feed/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404')
          }
          return
        }
        const data = await response.json()
        setContent(data.item)
        setLikeState({ liked: data.liked, likes: data.item.likes })
      } catch (error) {
        console.error('Failed to load content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [id, router])

  // 获取评论列表
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/feed/${id}/comments`)
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.comments)) {
          setComments(data.comments)
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }

    if (id) {
      loadComments()
    }
  }, [id])

  // 处理点赞
  const handleLike = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`/api/feed/${id}/like`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('请先登录')
        }
        return
      }

      const result = await response.json()
      setLikeState({ liked: result.liked, likes: result.likes })
      
      // 更新内容中的点赞数
      setContent((prev) => prev ? { ...prev, likes: result.likes } : null)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  // 发送评论
  const handleSendComment = async () => {
    const content = draft.trim()
    if (!content || isSending) return

    setIsSending(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        alert('请先登录')
        return
      }

      const response = await fetch(`/api/feed/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          replyToName: replyTo,
          mentions: extractMentions(content),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('请先登录')
        }
        return
      }

      const data = await response.json()
      if (data.comment) {
        setComments((current) => [data.comment, ...current])
        setContent((prev) => prev ? { ...prev, comments: data.commentsCount ?? prev.comments + 1 } : null)
        setDraft('')
        setReplyTo(null)
      }
    } finally {
      setIsSending(false)
    }
  }

  // 回复某人
  const handleReply = (name: string) => {
    setReplyTo(name)
    setDraft((current) => {
      const next = current.trim().length > 0 ? current : ''
      return next.startsWith(`@${name} `) ? next : `@${name} ${next}`.trimStart()
    })
  }

  // 提取 @提及
  const extractMentions = (value: string) => {
    return Array.from(value.matchAll(/@([^\s@]+)/g)).map((match) => match[1])
  }

  // 分享
  const handleShare = async () => {
    setShareOpen(true)
  }

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-slate-200" />
            <div className="h-64 rounded-lg bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (!content) {
    return (
      <main className="relative min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center py-20">
          <p className="text-slate-500">内容不存在或已被删除</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.08),transparent_24%)]" />

      <Navbar />

      <div className="relative mx-auto max-w-4xl pt-16 sm:pt-20">
        {/* 返回按钮 */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>

        {/* 内容卡片 */}
        <Surface className="overflow-hidden p-0">
          <div className="p-4 sm:p-5">
            <div className="flex gap-3 items-center">
              <Link href={`/user/${content.authorId || encodeURIComponent(content.author)}`} className="shrink-0">
                <UserAvatar name={content.author} avatarUrl={content.authorAvatar} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/user/${content.authorId || encodeURIComponent(content.author)}`}
                    className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition"
                  >
                    {content.author}
                  </Link>
                  <span className="text-xs text-slate-400">发布于 {content.channel}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {(content.tags || []).map((tag) => (
                    <Badge key={tag} tone="cyan" className="text-[11px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{content.title}</h1>
              <p className="mt-2 text-sm leading-7 text-slate-700">{content.summary}</p>
            </div>
          </div>

          {/* 媒体内容 */}
          {content.mediaType === 'video' && content.mediaSrc ? (
            <VideoPlayer src={content.mediaSrc} orientation={content.mediaOrientation} />
          ) : content.mediaType === 'music' ? (
            <div className="px-4 pb-2 sm:px-5">
              <div className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-gradient-to-r from-cyan-50 to-orange-50 p-4">
                {content.musicCover && (
                  <img src={content.musicCover} alt={content.title} className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{content.title}</p>
                  {content.musicDuration && (
                    <p className="text-sm text-slate-500">时长: {content.musicDuration}</p>
                  )}
                </div>
                {content.musicAudio && (
                  <audio controls className="w-48">
                    <source src={content.musicAudio} />
                  </audio>
                )}
              </div>
            </div>
          ) : content.mediaType === 'video' && content.mediaSrc ? (
            <div className="px-4 pb-2 sm:px-5">
              <video
                src={content.mediaSrc}
                controls
                className="w-full max-w-[560px] rounded-[20px]"
              />
            </div>
          ) : null}

          {/* 互动按钮 */}
          <div className="px-4 py-3 sm:px-5 border-t border-slate-100 pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-400">
              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={handleLike}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 transition active:scale-75 pointer-events-auto",
                    likeState?.liked
                      ? "text-rose-500 hover:text-rose-600"
                      : "hover:text-slate-600"
                  )}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      likeState?.liked && "fill-current scale-110"
                    )}
                  />
                  <span className={cn("font-medium", likeState?.liked && "text-rose-500")}>
                    {likeState?.likes ?? content.likes}
                  </span>
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  {content.comments}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 transition hover:text-slate-600 pointer-events-auto"
                >
                  <Share2 className="h-4 w-4" />
                  分享
                </button>
              </div>
            </div>
          </div>
        </Surface>

        {/* 评论区 */}
        <Surface className="mt-4 overflow-hidden p-0">
          <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
            <h2 className="text-lg font-semibold text-slate-900">{content.comments} 条评论</h2>
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-4 py-4 sm:px-5">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">暂无评论，来说点什么吧～</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <article key={comment.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-sm font-semibold text-slate-950">
                        {comment.avatar?.startsWith('http') || comment.avatar?.startsWith('/') ? (
                          <img src={comment.avatar} alt={comment.author} className="h-full w-full object-cover" />
                        ) : (
                          comment.avatar
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/user/${encodeURIComponent(comment.author)}`}
                            className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition"
                          >
                            {comment.author}
                          </Link>
                          <span className="text-xs text-slate-400">{comment.time}</span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-700">{comment.content}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleReply(comment.author)}
                            className="inline-flex items-center gap-1.5 transition hover:text-slate-900"
                          >
                            回复
                          </button>
                          <span>{comment.likes ?? 0} 赞</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* 评论输入框 */}
          <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5">
            {replyTo && (
              <div className="mb-3 flex items-center justify-between rounded-full bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                <span>回复 @{replyTo}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-cyan-700">
                  取消
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="说点什么..."
                className="flex-1 resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 min-h-12 max-h-32"
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={isSending || !draft.trim()}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {isSending ? '发送中' : '发送'}
              </button>
            </div>
          </div>
        </Surface>

        {shareOpen && content && (
          <ShareModal content={content} onClose={() => setShareOpen(false)} />
        )}
      </div>
    </main>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function VideoPlayer({
  src,
  orientation,
}: {
  src: string
  orientation?: 'horizontal' | 'vertical'
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('00:00 / 00:00')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) return
      setProgress((video.currentTime / video.duration) * 100)
      setProgressLabel(`${formatTime(video.currentTime)} / ${formatTime(video.duration)}`)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setProgressLabel('00:00 / 00:00')
    }

    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  return (
    <div className="px-4 pb-2 sm:px-5">
      <div
        className={cn(
          'group overflow-hidden rounded-[20px] border border-white/70 bg-black/90 shadow-[0_12px_30px_rgba(15,23,42,0.12)]',
          orientation === 'vertical'
            ? 'w-[75vw] sm:mr-auto sm:w-[clamp(180px,32vw,260px)]'
            : 'w-full max-w-[560px]'
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          className="relative block w-full"
        >
          <video
            ref={videoRef}
            src={src}
            className={cn(
              'block w-full object-contain',
              orientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-[16/9]'
            )}
            playsInline
            preload="metadata"
          />
          <div
            className={cn(
              'absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.24))] transition duration-300',
              orientation === 'vertical'
                ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition duration-300',
                orientation === 'vertical'
                  ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              )}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </div>
          </div>
        </button>

        <div className="px-3 pb-3 pt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>{isPlaying ? '播放中' : '待播放'}</span>
            <span>{progressLabel}</span>
          </div>
          <div className="mt-1.5 h-[2px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-slate-300 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ShareModal({
  content,
  onClose,
}: {
  content: ContentItem
  onClose: () => void
}) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/content/${content.id}` : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('链接已复制')
    } catch {
      prompt('复制链接:', shareUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <span className="text-xl">×</span>
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">分享内容</h3>

          <div className="mt-4 flex flex-col items-center">
            <div className="overflow-hidden rounded-xl border-4 border-slate-100 bg-white p-2 shadow-inner">
              <img src={qrCodeUrl} alt="二维码" className="h-[180px] w-[180px]" />
            </div>
            <p className="mt-3 text-xs text-slate-400">扫码查看详情</p>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h4 className="font-medium text-slate-900">{content.title}</h4>
            <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{content.summary}</p>
            <div className="mt-3 flex items-center gap-2">
              <UserAvatar name={content.author} avatarUrl={content.authorAvatar} size="sm" />
              <span className="text-sm text-slate-600">{content.author}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 rounded-xl bg-cyan-600 py-3 text-sm font-medium text-white transition hover:bg-cyan-700"
            >
              复制链接
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: content.title,
                    text: content.summary,
                    url: shareUrl,
                  })
                } else {
                  handleCopyLink()
                }
              }}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              分享到...
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
