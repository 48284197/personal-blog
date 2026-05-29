'use client'

import { useEffect, useState, useRef, use } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Play, Pause } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface, Badge } from '@/components/landing'
import { UserAvatar } from '@/components/user-card'
import { cn } from '@/lib/utils'
import { getResponseErrorMessage } from '@/lib/response-error'
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
      const response = await fetch(`/api/feed/${id}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('请先登录')
        } else {
          alert(await getResponseErrorMessage(response, '点赞失败'))
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
      const response = await fetch(`/api/feed/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        } else {
          alert(await getResponseErrorMessage(response, '评论发送失败'))
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
                <UserAvatar
                  name={content.author}
                  avatarUrl={content.authorAvatar}
                  href={content.authorId ? `/user/${content.authorId}` : undefined}
                  size="md"
                />
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
              {content.title ? (
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{content.title}</h1>
              ) : null}
              <p className="mt-2 text-sm leading-7 text-slate-700">{content.content}</p>
            </div>
          </div>

          {/* 媒体内容 */}
          {content.mediaType === 'video' && content.mediaSrc ? (
            <VideoPlayer src={content.mediaSrc} orientation={content.mediaOrientation} />
          ) : content.mediaType === 'music' ? (
            <div className="px-4 pb-2 sm:px-5">
              <div className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-gradient-to-r from-cyan-50 to-orange-50 p-4">
                {content.musicCover && (
                  <Image src={content.musicCover} alt={content.title || '音乐封面'} width={64} height={64} unoptimized className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{content.title || '音乐内容'}</p>
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
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-sm font-semibold text-slate-950">
                        {comment.avatar?.startsWith('http') || comment.avatar?.startsWith('/') ? (
                          <Image src={comment.avatar} alt={comment.author} fill sizes="40px" unoptimized className="h-full w-full object-cover" />
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

        {shareOpen && content
          ? createPortal(
              <ShareModal content={content} onClose={() => setShareOpen(false)} />,
              document.body
            )
          : null}
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
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      prompt('复制链接:', shareUrl)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭分享弹窗"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-700"
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        <div className="bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.12),transparent_34%)] p-6 sm:p-7">
          <div className="pr-10">
            <p className="text-sm font-medium tracking-[0.22em] text-cyan-600 uppercase">分享详情页</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">快来扫一扫来我们平台</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              扫码即可打开这篇内容的详情页，也可以直接复制链接分享给好友。
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
              <Image src={qrCodeUrl} alt="详情页二维码" width={200} height={200} unoptimized className="h-[200px] w-[200px]" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">扫码查看详情</p>
          </div>

            <div className="mt-5 rounded-[22px] border border-slate-100 bg-white/90 p-4">
            <h4 className="text-base font-semibold text-slate-900">{content.title || '这条内容'}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{content.content}</p>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                name={content.author}
                avatarUrl={content.authorAvatar}
                href={content.authorId ? `/user/${content.authorId}` : undefined}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{content.author}</p>
                <p className="text-xs text-slate-500 truncate">{shareUrl}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {copied ? '已复制链接' : '复制详情链接'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: content.title || '这条内容',
                    text: content.content,
                    url: shareUrl,
                  })
                } else {
                  handleCopyLink()
                }
              }}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              分享到...
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
