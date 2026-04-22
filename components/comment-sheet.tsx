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
import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { Send, X } from 'lucide-react'
import type { CommentItem, ContentItem } from '@/lib/site-data'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

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


export function CommentSheetProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<CommentTarget | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const closeTimerRef = useRef<number | null>(null)

  const openComments = useCallback((nextTarget: CommentTarget) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsClosing(false)
    setTarget(nextTarget)
    setComments(nextTarget.commentPreview?.length ? nextTarget.commentPreview : [])
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
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const mentionsRef = useRef<HTMLDivElement | null>(null)

  // 提取评论区的所有唯一用户
  const mentionUsers = useMemo(() => {
    const users = new Map<string, { name: string; avatar: string }>()
    comments.forEach((comment) => {
      if (!users.has(comment.author)) {
        users.set(comment.author, { name: comment.author, avatar: comment.avatar })
      }
    })
    return Array.from(users.values())
  }, [comments])

  // 过滤匹配的用户
  const filteredUsers = useMemo(() => {
    if (!mentionSearch) return mentionUsers
    return mentionUsers.filter((user) =>
      user.name.toLowerCase().includes(mentionSearch.toLowerCase())
    )
  }, [mentionUsers, mentionSearch])

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

  // 处理输入变化，检测 @ 字符
  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    const cursor = event.target.selectionStart
    setDraft(value)
    setCursorPosition(cursor)

    // 检测是否刚输入了 @
    const beforeCursor = value.slice(0, cursor)
    const atIndex = beforeCursor.lastIndexOf('@')

    if (atIndex !== -1) {
      const afterAt = beforeCursor.slice(atIndex + 1)
      // 如果在 @ 之后没有空格或换行，显示提及列表
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionSearch(afterAt)
        setShowMentions(true)
        setMentionIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // 选择用户
  const selectMentionUser = (userName: string) => {
    const beforeCursor = draft.slice(0, cursorPosition)
    const atIndex = beforeCursor.lastIndexOf('@')
    const beforeAt = draft.slice(0, atIndex)
    const afterCursor = draft.slice(cursorPosition)
    
    const newDraft = `${beforeAt}@${userName} ${afterCursor}`
    setDraft(newDraft)
    setShowMentions(false)
    
    // 聚焦并设置光标位置
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      const newPosition = atIndex + userName.length + 2 // +2 为 @ 和空格
      textareaRef.current?.setSelectionRange(newPosition, newPosition)
    })
  }

  // 键盘导航
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length)
        break
      case 'Enter':
        if (filteredUsers.length > 0) {
          event.preventDefault()
          selectMentionUser(filteredUsers[mentionIndex].name)
        }
        break
      case 'Escape':
        setShowMentions(false)
        break
    }
  }

  // 点击外部关闭提及列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node)) {
        setShowMentions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content || isSending) return

    setIsSending(true)

    try {
      // 获取当前 session token
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        alert('请先登录')
        return
      }

      const response = await fetch(`/api/feed/${target.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-sm font-semibold text-slate-950">
                    {comment.avatar?.startsWith('http') || comment.avatar?.startsWith('/') ? (
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="h-full w-full object-cover"
                      />
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

          <div className="relative flex-1">
            {showMentions && filteredUsers.length > 0 && (
              <div
                ref={mentionsRef}
                className="absolute bottom-full left-0 z-50 mb-2 w-56 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                {filteredUsers.map((user, index) => (
                  <button
                    key={user.name}
                    type="button"
                    onClick={() => selectMentionUser(user.name)}
                    className={[
                      'flex w-full items-center gap-2 px-3 py-2 text-left transition',
                      index === mentionIndex ? 'bg-cyan-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-xs font-semibold text-slate-950">
                      {user.avatar?.startsWith('http') || user.avatar?.startsWith('/') ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        user.avatar?.slice(0, 2) || user.name.slice(0, 2)
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{user.name}</span>
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              placeholder="说点什么，或用 @ 提到某个人..."
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                if (!draft.trim()) {
                  setIsFocused(false)
                }
              }}
              className={[
                'w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 transition-[min-height] duration-200',
                isFocused ? 'min-h-20' : 'min-h-12',
              ].join(' ')}
            />
          </div>
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
  )
}

function extractMentions(value: string) {
  return Array.from(value.matchAll(/@([^\s@]+)/g)).map((match) => match[1])
}
