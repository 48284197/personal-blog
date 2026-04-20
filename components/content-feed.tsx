import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Flame,
} from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { useCommentSheet } from '@/components/comment-sheet'
import { MediaGallery } from '@/components/media-gallery'
import { useExclusiveMediaPlayback, useMediaController } from '@/components/media-controller'
import { type ContentItem } from '@/lib/site-data'
import { cn } from '@/lib/utils'

const feedOrder = ['dialogue', 'discussion', 'co-create', 'knowledge'] as const

const avatarMap: Record<string, string> = {
  dialogue: '碳',
  discussion: '研',
  'co-create': '创',
  knowledge: '知',
}

type ContentFeedProps = {
  refreshKey?: number
}

export function ContentFeed({ refreshKey = 0 }: ContentFeedProps) {
  const { openComments } = useCommentSheet()
  const [feedData, setFeedData] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadFeed = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/feed')
        if (!response.ok) return

        const data = (await response.json()) as { items?: ContentItem[] }
        if (!cancelled && Array.isArray(data.items)) {
          setFeedData(data.items)
        }
      } catch {
        // error loading feed
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadFeed()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const handleCommentCountChange = (id: string, count: number) => {
    setFeedData((current) =>
      current.map((item) => (item.id === id ? { ...item, comments: count } : item))
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {feedData.map((item, index) => {
        const avatar = avatarMap[item.channel]
        const topicLabel = item.topic ?? item.title

        return (
          <Surface key={item.id} className="overflow-hidden p-0">
            <div className="p-4 sm:p-5">
              <div className="flex gap-3 items-center justify-between">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-orange-300 text-xs font-semibold text-slate-950">
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.author}</p>
                    <Badge tone="slate" className="scale-90 origin-left opacity-80">{topicLabel}</Badge>
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/60 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                        <Flame className="h-3 w-3" />
                        热搜 18
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

             {item.summary ? <p className="mt-3 text-[14px] leading-6 text-slate-700">{item.summary}</p> : null}
            </div>

            <MediaPanel
              mediaType={item.mediaType}
              title={item.title}
              label={item.mediaLabel}
              detail={item.mediaDetail}
              orientation={item.mediaOrientation}
              musicDuration={item.musicDuration}
              musicCover={item.musicCover}
              musicAudio={item.musicAudio}
              tags={item.tags}
              images={item.mediaImages}
              src={item.mediaSrc}
              mediaId={`${item.mediaType}-${item.id}`}
            />

            <div className="px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-400">
                <div className="flex flex-wrap items-center gap-5">
                  <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-slate-600">
                    <Heart className="h-4 w-4" />
                    {item.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openComments({
                        id: item.id,
                        title: item.title,
                        summary: item.summary,
                        author: item.author,
                        comments: item.comments,
                        channel: item.channel,
                        commentPreview: item.commentPreview,
                        onCommentCountChange: (nextCount) => handleCommentCountChange(item.id, nextCount),
                      })
                    }
                    className="inline-flex items-center gap-1.5 transition hover:text-slate-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {item.comments}
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-slate-600">
                    <Share2 className="h-4 w-4" />
                    分享
                  </button>
                </div>
              </div>
            </div>
          </Surface>
        )
      })}
    </div>
  )
}

function MediaPanel({
  mediaType,
  title,
  label,
  detail,
  orientation,
  musicDuration,
  musicCover,
  musicAudio,
  tags,
  images,
  src,
  mediaId,
}: {
  mediaType: 'text' | 'image' | 'video' | 'music'
  title: string
  label: string
  detail: string
  orientation?: 'horizontal' | 'vertical'
  musicDuration?: string
  musicCover?: string
  musicAudio?: string
  tags?: string[]
  images?: string[]
  src?: string
  mediaId: string
}) {
  const mediaImages = images?.length ? images : src ? [src] : []

  if (mediaType === 'video') {
    return (
      <VideoCard
        mediaId={mediaId}
        orientation={orientation}
        src={src}
      />
    )
  }

  if (mediaType === 'music') {
    return (
      <MusicCard
        mediaId={mediaId}
        title={title}
        label={label}
        detail={detail}
        musicDuration={musicDuration}
        musicCover={musicCover}
        musicAudio={musicAudio}
        tags={tags}
      />
    )
  }

  if (mediaType === 'text') {
    return <TextCard title={title} detail={detail} tags={tags} />
  }

  return (
    mediaImages.length > 0 ? (
      <MediaGallery images={mediaImages} title={title} galleryId={mediaId} />
    ) : (
      <div className="px-4 pb-2 sm:px-5">
        <div className="flex min-h-[180px] w-full items-center justify-center rounded-[20px] bg-slate-50/50 border border-slate-100">
          <span className="rounded-full bg-cyan-100/50 px-3 py-1 text-xs font-medium text-cyan-700">
            图片内容
          </span>
        </div>
      </div>
    )
  )
}

function VideoCard({
  mediaId,
  orientation,
  src,
}: {
  mediaId: string
  orientation?: 'horizontal' | 'vertical'
  src?: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const savedPositionRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('00:00 / 00:00')
  const { setActiveMediaId, playbackPositions, setPlaybackPosition } = useMediaController()
  const { requestToggle } = useExclusiveMediaPlayback(mediaId, videoRef)
  const videoSrc =
    src ??
    (orientation === 'vertical'
      ? '/jimeng-2026-03-24-8525.mp4'
      : '/jimeng-2025-02-20-8485.mp4')

  useEffect(() => {
    savedPositionRef.current = playbackPositions[mediaId] ?? 0
  }, [mediaId, playbackPositions])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) return
      setProgress((video.currentTime / video.duration) * 100)
      setProgressLabel(`${formatTime(video.currentTime)} / ${formatTime(video.duration)}`)
      setPlaybackPosition(mediaId, video.currentTime)
    }

    const restorePosition = () => {
      if (savedPositionRef.current > 0) {
        video.currentTime = savedPositionRef.current
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      setIsPlaying(false)
      setPlaybackPosition(mediaId, video.currentTime)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setPlaybackPosition(mediaId, 0)
      setActiveMediaId(null)
    }

    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadedmetadata', restorePosition)

    restorePosition()

    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadedmetadata', restorePosition)
    }
  }, [mediaId, setActiveMediaId, setPlaybackPosition])

  const togglePlay = async () => {
    await requestToggle()
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
            src={videoSrc}
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

function TextCard({
  title,
  detail,
  tags,
}: {
  title: string
  detail: string
  tags?: string[]
}) {
  return (
    <div className="px-4 pb-2 sm:px-5">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">text post</p>
          <h4 className="mt-1.5 text-base font-semibold text-slate-900">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {(tags?.length ? tags : ['观点', '讨论', '发布']).map((tag) => (
              <Badge key={tag} tone="slate" className="scale-90 origin-left opacity-70">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MusicCard({
  mediaId,
  title,
  label,
  detail,
  musicDuration,
  musicCover,
  musicAudio,
  tags,
}: {
  mediaId: string
  title: string
  label: string
  detail: string
  musicDuration?: string
  musicCover?: string
  musicAudio?: string
  tags?: string[]
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const savedPositionRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [durationLabel, setDurationLabel] = useState(musicDuration ?? '00:00')
  const { setActiveMediaId, playbackPositions, setPlaybackPosition } = useMediaController()
  const { requestToggle } = useExclusiveMediaPlayback(mediaId, audioRef)

  useEffect(() => {
    savedPositionRef.current = playbackPositions[mediaId] ?? 0
  }, [mediaId, playbackPositions])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return
      setProgress((audio.currentTime / audio.duration) * 100)
      setDurationLabel(formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration))
      setPlaybackPosition(mediaId, audio.currentTime)
    }

    const restorePosition = () => {
      if (savedPositionRef.current > 0) {
        audio.currentTime = savedPositionRef.current
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      setIsPlaying(false)
      setPlaybackPosition(mediaId, audio.currentTime)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      setPlaybackPosition(mediaId, 0)
      setActiveMediaId(null)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', restorePosition)

    restorePosition()

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', restorePosition)
    }
  }, [mediaId, setActiveMediaId, setPlaybackPosition])

  const togglePlay = async () => {
    await requestToggle()
  }

  return (
    <div className="px-4 pb-2 sm:px-5">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[20px] border border-white/70 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
          <button
            type="button"
            onClick={togglePlay}
            className="group relative aspect-square w-full overflow-hidden rounded-[16px] bg-slate-100 shadow-sm sm:h-[140px] sm:w-[140px] sm:flex-none sm:shrink-0"
          >
            {musicCover ? (
              <Image
                src={musicCover}
                alt={title}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 140px"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.18))] opacity-0 transition duration-300 group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </div>
            </div>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">music</p>
                <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {durationLabel}
                </span>
              </div>
              <h4 className="mt-1 text-base font-semibold text-slate-900">{title}</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(tags?.slice(0, 3).length ? tags.slice(0, 3) : ['治愈', '轻电子', '氛围感']).map((tag) => (
                  <Badge key={tag} tone="slate" className="scale-90 origin-left opacity-70">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 line-clamp-2">{detail}</p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{isPlaying ? '播放中' : '点击播放'}</span>
                <span>{label}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-300 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <audio ref={audioRef} preload="metadata" src={musicAudio} />
      </div>
    </div>
  )
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00'
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const remaining = Math.floor(safe % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}
