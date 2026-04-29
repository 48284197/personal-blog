import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Loader2,
} from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { useCommentSheet } from '@/components/comment-sheet'
import { MediaGallery } from '@/components/media-gallery'
import { useExclusiveMediaPlayback, useMediaController } from '@/components/media-controller'
import { UserAvatar } from '@/components/user-card'
import { type ContentItem } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

// --- 1. 基础动画配置 ---
const fadeInScale = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
}

// --- 2. 动画粒子组件 ---
function LikeParticles({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{ 
                scale: [0, 1.2, 0],
                x: Math.cos((i * 45 * Math.PI) / 180) * 40,
                y: Math.sin((i * 45 * Math.PI) / 180) * 40,
                opacity: 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute"
            >
              <Heart className="h-2 w-2 fill-rose-500 text-rose-500" />
            </motion.span>
          ))}
        </span>
      )}
    </AnimatePresence>
  )
}

// --- 3. 媒体卡片子组件 ---
function VideoCard({ mediaId, orientation, src }: { mediaId: string, orientation?: string, src?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const { setPlaybackPosition, playbackPositions } = useMediaController()
  const { requestToggle } = useExclusiveMediaPlayback(mediaId, videoRef)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playbackPositions[mediaId]) video.currentTime = playbackPositions[mediaId]

    const update = () => setProgress((video.currentTime / video.duration) * 100)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', update)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('timeupdate', update)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [mediaId, playbackPositions])

  return (
    <div className="px-4 pb-2 sm:px-5">
      <div className={cn(
        "group relative overflow-hidden rounded-[24px] bg-slate-900 shadow-xl transition-all duration-500 hover:shadow-2xl",
        orientation === 'vertical' ? 'aspect-[9/16] w-[280px]' : 'aspect-video w-full'
      )}>
        <video 
          ref={videoRef} 
          src={src || '/default-video.mp4'} 
          className="h-full w-full object-cover" 
          playsInline 
          onClick={() => requestToggle()}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div 
            className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  )
}

function MusicCard({ title, detail, musicCover, musicAudio, mediaId }: { title: string; detail: string; musicCover?: string; musicAudio?: string; mediaId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const { requestToggle } = useExclusiveMediaPlayback(mediaId, audioRef)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress((audio.currentTime / audio.duration) * 100)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    return () => {
      audio.removeEventListener('timeupdate', update)
    }
  }, [])

  return (
    <div className="px-4 pb-2 sm:px-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row">
        <div 
          className="relative h-32 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl group"
          onClick={() => requestToggle()}
        >
          {musicCover && <Image src={musicCover} alt={title} fill className="object-cover transition-transform group-hover:scale-110" />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying ? <Pause className="text-white" /> : <Play className="text-white fill-white" />}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <h4 className="font-bold text-slate-900 line-clamp-1">{title}</h4>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{detail}</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">{isPlaying ? 'Playing Now' : 'Click to Play'}</p>
          </div>
        </div>
        <audio ref={audioRef} src={musicAudio} />
      </div>
    </div>
  )
}

// --- 4. 核心 FeedItem 组件 (性能关键：使用 Memo) ---
const FeedItem = React.memo<{ item: ContentItem; onOpenComments: (item: ContentItem) => void; onShare: (item: ContentItem) => void }>(({ item, onOpenComments, onShare }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.likes)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = async () => {
    const nextState = !isLiked
    setIsLiked(nextState)
    setLikeCount(prev => nextState ? prev + 1 : prev - 1)
    setIsAnimating(true)
    try {
      // TODO: 调用 API
    } catch {
      setIsLiked(!nextState)
      setLikeCount(prev => !nextState ? prev + 1 : prev - 1)
    }
    setTimeout(() => setIsAnimating(false), 1000)
  }

  return (
    <motion.div layout {...fadeInScale}>
      <Surface className="overflow-hidden p-0 border-none shadow-sm ring-1 ring-slate-100 hover:ring-cyan-100 transition-all">
        <div className="p-4 sm:p-5">
          <div className="flex gap-3 items-center">
            <UserAvatar name={item.author} avatarUrl={item.authorAvatar} size="md" />
            <div className="flex-1 min-w-0">
              <Link href={`/user/${item.author}`} className="text-sm font-bold text-slate-900 hover:text-cyan-600 transition-colors">
                {item.author}
              </Link>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.publishedAt || '刚刚'}</p>
            </div>
          </div>
        </div>

        <MediaPanel item={item} />

        <div className="flex items-center gap-4 px-4 py-3 sm:px-5">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-rose-500 transition-colors"
          >
            <div className="relative">
              <motion.span
                animate={isAnimating ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("h-5 w-5 transition-colors", isLiked && "fill-rose-500 text-rose-500")} />
              </motion.span>
              <LikeParticles active={isAnimating} />
            </div>
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => onOpenComments(item)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-cyan-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{item.comments}</span>
          </button>

          <button
            onClick={() => onShare(item)}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </Surface>
    </motion.div>
  )
})
FeedItem.displayName = 'FeedItem'

function MediaPanel({ item }: { item: ContentItem }) {
  const mediaId = `${item.mediaType}-${item.id}`
  switch (item.mediaType) {
    case 'video': return <VideoCard mediaId={mediaId} orientation={item.mediaOrientation} src={item.mediaSrc} />
    case 'music': return <MusicCard title={item.title} detail={item.summary || ''} musicCover={item.musicCover} musicAudio={item.musicAudio} mediaId={mediaId} />
    case 'image': return <MediaGallery images={item.mediaImages || [item.mediaSrc || '']} title={item.title} galleryId={mediaId} />
    default: return (
      <div className="px-5 pb-2">
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <h4 className="font-bold text-slate-800">{item.title}</h4>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.mediaDetail}</p>
        </div>
      </div>
    )
  }
}

// --- 5. 主 Feed 组件 ---
export function ContentFeed({ initialItems = [], initialHasMore = true, refreshKey }: { initialItems?: ContentItem[]; initialHasMore?: boolean; refreshKey?: number }) {
  const [feedData, setFeedData] = useState<ContentItem[]>(initialItems)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [shareItem, setShareItem] = useState<ContentItem | null>(null)
  const { openComments } = useCommentSheet()
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFeedData(initialItems)
    setHasMore(initialHasMore)
    setLoadingMore(false)
  }, [initialItems, initialHasMore, refreshKey])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/feed?offset=${feedData.length}&limit=10`)
      const data = await res.json()
      setFeedData(prev => [...prev, ...data.items])
      setHasMore(data.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [feedData.length, hasMore, loadingMore])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '400px' })
    if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="w-full space-y-6 pb-20 pt-2">
      <AnimatePresence mode="popLayout">
        {feedData.map((item) => (
          <FeedItem 
            key={item.id} 
            item={item} 
            onShare={setShareItem}
            onOpenComments={(item: ContentItem) => openComments({ id: item.id, title: item.title, summary: item.summary, author: item.author, comments: item.comments, channel: item.channel, onCommentCountChange: () => {} })} 
          />
        ))}
      </AnimatePresence>

      <div ref={loadMoreTriggerRef} className="flex justify-center py-8">
        {loadingMore ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        ) : hasMore ? (
          <div className="h-1" />
        ) : (
          <p className="text-xs font-medium uppercase tracking-widest text-slate-300">End of Feed</p>
        )}
      </div>

      <AnimatePresence>
        {shareItem && (
          <ShareModal content={shareItem} onClose={() => setShareItem(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// --- 6. 分享弹窗 (Framer Motion 增强) ---
function ShareModal({ content, onClose }: { content: ContentItem, onClose: () => void }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/content/${content.id}` : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
      />
      <motion.div 
        layoutId={`item-${content.id}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl"
      >
        <div className="p-8 text-center">
          <div className="inline-block rounded-3xl bg-slate-50 p-4 shadow-inner">
            <img src={qrCodeUrl} alt="QR" className="h-40 w-40" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">分享给好友</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed px-4">让更多人发现这篇精彩内容</p>
          
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
                onClose()
              }}
              className="flex-1 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-transform active:scale-95"
            >
              复制链接
            </button>
            <button 
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-100 py-4 text-sm font-bold text-slate-600 transition-transform active:scale-95"
            >
              取消
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
