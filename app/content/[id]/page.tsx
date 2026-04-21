'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, ArrowLeft, Send } from 'lucide-react'
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.08),transparent_24%)]" />

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
              <UserAvatar name={content.author} avatarUrl={content.authorAvatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{content.author}</p>
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
          {(content.mediaImages?.length || content.mediaSrc) ? (
            <MediaGallery
              images={content.mediaImages?.length ? content.mediaImages : content.mediaSrc ? [content.mediaSrc] : []}
              title={content.title}
              galleryId={`${content.mediaType}-${content.id}`}
            />
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
          <div className="px-4 py-3 sm:px-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-400">
              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={handleLike}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 transition active:scale-75",
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
                <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-slate-600">
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
                          <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
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
      </div>
    </main>
  )
}
