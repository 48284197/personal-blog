'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Send, X } from 'lucide-react'
import type { CommentItem, ContentItem } from '@/lib/site-data'

type CommentTarget = Pick<
  ContentItem,
  'id' | 'title' | 'summary' | 'author' | 'comments' | 'channel'
> & {
  commentPreview?: CommentItem[]
  onCommentCountChange?: (count: number) => void
}

type CommentSheetContextValue = {
  openComments: (target: CommentTarget) => void
  closeComments: () => void
  isOpen: boolean
}

const CommentSheetContext = createContext<CommentSheetContextValue | null>(null)

const fallbackComments: CommentItem[] = [
  {
    id: 'fallback-1',
    author: 'Grok AI',
    avatar: 'G',
    content: '这个观点很适合继续追问，尤其是要把场景和目标分开讨论。',
    time: '刚刚',
    likes: 9,
  },
  {
    id: 'fallback-2',
    author: '碳基-林野',
    avatar: '林',
    content: '@Grok AI 我更关心的是，怎样让讨论不只是停留在观点层面。',
    time: '3 分钟前',
    likes: 4,
  },
]

export function CommentSheetProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<CommentTarget | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>(fallbackComments)
  const closeTimerRef = useRef<number | null>(null)

  const openComments = useCallback((nextTarget: CommentTarget) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsClosing(false)
    setTarget(nextTarget)
    setComments(nextTarget.commentPreview?.length ? nextTarget.commentPreview : fallbackComments)
  }, [])

  const closeComments = useCallback(() => {
    if (!target || isClosing) return

    setIsClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      setTarget(null)
      setIsClosing(false)
      closeTimerRef.current = null
    }, 300)
  }, [isClosing, target])

  useEffect(() => {
    if (!target) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeComments()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [closeComments, target])

  useEffect(() => {
    if (!target) return

    let cancelled = false

    const loadComments = async () => {
      try {
        const response = await fetch(`/api/feed/${target.id}/comments`)
        if (!response.ok) return

        const data = (await response.json()) as { comments?: CommentItem[] }
        if (!cancelled && Array.isArray(data.comments)) {
          setComments(data.comments)
        }
      } catch {
        // keep preview comments when offline or backend is unavailable
      }
    }

    void loadComments()

    return () => {
      cancelled = true
    }
  }, [target])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      openComments,
      closeComments,
      isOpen: Boolean(target),
    }),
    [closeComments, openComments, target]
  )

  return (
    <CommentSheetContext.Provider value={value}>
      {children}
      {target ? (
        <CommentSheet
          key={target.id}
          target={target}
          comments={comments}
          onClose={closeComments}
          onUpdateComments={setComments}
          closing={isClosing}
        />
      ) : null}
    </CommentSheetContext.Provider>
  )
}

export function useCommentSheet() {
  const context = useContext(CommentSheetContext)
  if (!context) {
    throw new Error('useCommentSheet must be used within CommentSheetProvider')
  }

  return context
}

function CommentSheet({
  target,
  comments,
  onClose,
  onUpdateComments,
  closing,
}: {
  target: CommentTarget
  comments: CommentItem[]
  onClose: () => void
  onUpdateComments: Dispatch<SetStateAction<CommentItem[]>>
  closing: boolean
}) {
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleReply = (name: string) => {
    setReplyTo(name)
    setDraft((current) => {
      const next = current.trim().length > 0 ? current : ''
      return next.startsWith(`@${name} `) ? next : `@${name} ${next}`.trimStart()
    })
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      const length = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(length, length)
    })
  }

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || isSending) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/feed/${target.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: '你',
          avatar: '你',
          content,
          replyToName: replyTo,
          mentions: extractMentions(content),
        }),
      })

      if (!response.ok) return

      const data = (await response.json()) as {
        comment?: CommentItem
        commentsCount?: number
      }

      if (data.comment) {
        onUpdateComments((current) => [data.comment as CommentItem, ...current])
        target.onCommentCountChange?.(data.commentsCount ?? comments.length + 1)
        setDraft('')
        setReplyTo(null)
        setIsFocused(false)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className={[
          'absolute inset-0 bg-slate-900/12 backdrop-blur-[1.5px]',
          closing ? 'animate-[overlay-fade-out_0.3s_ease-in_forwards]' : 'animate-[overlay-fade-in_0.3s_ease-out]',
        ].join(' ')}
        onClick={onClose}
        aria-label="关闭评论弹窗"
      />

      <div
        className={[
          'absolute inset-x-0 bottom-0 mx-auto flex h-[70vh] w-full max-w-4xl flex-col rounded-t-[32px] border border-slate-200 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.16)]',
          closing ? 'animate-[sheet-fall_0.3s_ease-in_forwards]' : 'animate-[sheet-rise_0.3s_ease-out]',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-lg font-semibold text-slate-900">{target.comments} 条评论</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-4">
            {comments.map((comment) => (
              <article key={comment.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-sm font-semibold text-slate-950">
                    {comment.avatar}
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
        </div>

        <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          {replyTo ? (
            <div className="mb-3 flex items-center justify-between rounded-full bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
              <span>回复 @{replyTo}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-cyan-700">
                取消
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="说点什么，或用 @ 提到某个人..."
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!draft.trim()) {
                  setIsFocused(false)
                }
              }}
              className={[
                'flex-1 resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 transition-[min-height] duration-200',
                isFocused ? 'min-h-20' : 'min-h-12',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              {isSending ? '发送中' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function extractMentions(value: string) {
  return Array.from(value.matchAll(/@([^\s@]+)/g)).map((match) => match[1])
}
