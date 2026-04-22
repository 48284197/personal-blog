'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, MapPin, Link as LinkIcon, Calendar, FileText, Heart, MessageCircle, Image as ImageIcon, Music, Video, Edit3, X, Camera, Palette, Loader2, Play, Pause } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface, Badge } from '@/components/landing'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { ContentItem } from '@/lib/site-data'

const PRESET_HEADER_GRADIENTS = [
  { name: '青橙渐变', class: 'from-cyan-400 via-emerald-400 to-orange-400' },
  { name: '紫粉渐变', class: 'from-purple-400 via-pink-400 to-rose-400' },
  { name: '蓝紫渐变', class: 'from-blue-400 via-indigo-400 to-violet-400' },
  { name: '橙红渐变', class: 'from-amber-400 via-orange-400 to-red-400' },
  { name: '青蓝渐变', class: 'from-teal-400 via-cyan-400 to-blue-400' },
  { name: '绿青渐变', class: 'from-lime-400 via-green-400 to-emerald-400' },
  { name: '粉紫渐变', class: 'from-rose-400 via-fuchsia-400 to-purple-400' },
  { name: '黄橙渐变', class: 'from-yellow-400 via-amber-400 to-orange-400' },
]

const DEFAULT_AVATARS = [
  'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699480272-generated-1776699479874-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699493854-generated-1776699493508-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699542554-generated-1776699542189-0.jpeg',
]

type UserProfile = {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  headerColor: string | null
  headerImage: string | null
  joinedAt: string
  postsCount: number
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [publications, setPublications] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const isOwnProfile = currentUser?.id === id

  useEffect(() => {
    const loadCurrentUser = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUser({ id: data.user.id })
        }
      }
    }

    const loadUser = async () => {
      try {
        const response = await fetch(`/api/user/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404')
          }
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }

    const loadPublications = async () => {
      try {
        const response = await fetch(`/api/user/${id}/publications`)
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.publications)) {
          setPublications(data.publications)
        }
      } catch (error) {
        console.error('Failed to load publications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentUser()
    loadUser()
    loadPublications()
  }, [id, router])

  if (loading) {
    return (
      <main className="relative min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="relative min-h-screen bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center py-20">
          <p className="text-slate-500">用户不存在</p>
        </div>
      </main>
    )
  }

  const gradient = user.headerColor || getGradientFromName(user.name)
  const joinedDate = new Date(user.joinedAt)

  return (
    <main className="relative min-h-screen bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.08),transparent_24%)]" />

      <Navbar />

      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 pt-20">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/content"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回内容
          </Link>
        </div>

        {/* 用户卡片 */}
        <Surface className="overflow-hidden p-0">
          {/* 头部背景 */}
          <div
            className={cn('relative h-40 sm:h-56 w-full bg-gradient-to-br', gradient)}
            style={user.headerImage ? { backgroundImage: `url(${user.headerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {user.headerImage && <div className="absolute inset-0 bg-black/20" />}

            {/* 设置按钮 - 仅本人可见 */}
            {isOwnProfile && (
              <button
                onClick={() => setShowSettings(true)}
                className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
              >
                <Settings className="h-4 w-4" />
                设置
              </button>
            )}
          </div>

          {/* 用户信息 */}
          <div className="relative px-6 pb-8 sm:px-8">
            {/* 头像 */}
            <div className="relative -mt-16 mb-4 flex justify-center">
              <div className="inline-block rounded-full bg-white p-1 shadow-lg">
                <div className={cn(
                  'flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-3xl font-bold text-white',
                  gradient
                )}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.slice(0, 2)
                  )}
                </div>
              </div>
            </div>

            {/* 名称 */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="mt-1 text-sm text-slate-500">@{user.email?.split('@')[0]}</p>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-4 text-center text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">{user.bio}</p>
            )}

            {/* 元信息 */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700"
                >
                  <LinkIcon className="h-4 w-4" />
                  {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {joinedDate.getFullYear()}年{joinedDate.getMonth() + 1}月加入
              </span>
            </div>

            {/* 统计 */}
            <div className="mt-6 flex items-center justify-center gap-8 border-t border-slate-100 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{publications.length}</div>
                <div className="text-sm text-slate-500">发布</div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {publications.reduce((sum, item) => sum + item.likes, 0)}
                </div>
                <div className="text-sm text-slate-500">获赞</div>
              </div>
            </div>
          </div>
        </Surface>

        {/* 内容列表 - 瀑布流布局 */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">发布的内容</h2>

          {publications.length === 0 ? (
            <Surface className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">还没有发布任何内容</p>
            </Surface>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {publications.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && user && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            window.location.reload()
          }}
        />
      )}
    </main>
  )
}

function ContentCard({ item }: { item: ContentItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const getMediaIcon = () => {
    switch (item.mediaType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'music':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getCoverImage = () => {
    if (item.mediaImages && item.mediaImages.length > 0) {
      return item.mediaImages[0]
    }
    if (item.musicCover) {
      return item.musicCover
    }
    if (item.mediaSrc) {
      return item.mediaSrc
    }
    return null
  }

  const coverImage = getCoverImage()
  const isVideo = item.mediaType === 'video'

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) return
      setProgress((video.currentTime / video.duration) * 100)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
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

  const getAspectRatio = () => {
    if (isVideo) {
      return item.mediaOrientation === 'vertical' ? '9/16' : '16/9'
    }
    if (item.mediaType === 'image') {
      return '3/4'
    }
    if (item.mediaType === 'music') {
      return '1/1'
    }
    return '16/10'
  }

  return (
    <Link href={`/content/${item.id}`} className="block break-inside-avoid mb-4">
      <Surface className="group overflow-hidden p-0 transition hover:shadow-lg cursor-pointer">
        {/* 媒体区域 */}
        <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: getAspectRatio() }}>
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={item.mediaSrc}
                className={cn(
                  'block w-full h-full object-cover',
                  item.mediaOrientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-[16/9]'
                )}
                playsInline
                preload="metadata"
                onClick={togglePlay}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
              </div>
              {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                  <div className="h-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white/60 transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : coverImage ? (
            <Image
              src={coverImage}
              alt={item.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge tone="slate" className="bg-white/90 backdrop-blur-sm">
              {getMediaIcon()}
            </Badge>
          </div>
        </div>

        {/* 内容信息 */}
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.summary}</p>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {item.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {item.comments}
              </span>
            </div>
            <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</span>
          </div>
        </div>
      </Surface>
    </Link>
  )
}

function SettingsModal({
  user,
  onClose,
  onUpdate,
}: {
  user: UserProfile
  onClose: () => void
  onUpdate: () => void
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'header'>('profile')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatarUrl: user.avatarUrl || '',
    headerColor: user.headerColor || '',
    headerImage: user.headerImage || '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '保存失败')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('保存出错:', error)
      alert(error instanceof Error ? error.message : '保存出错')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">个人设置</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {[
            { id: 'profile', label: '基本信息', icon: Edit3 },
            { id: 'avatar', label: '头像', icon: Camera },
            { id: 'header', label: '背景', icon: Palette },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-500 text-cyan-600'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">昵称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">简介</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 resize-none"
                  placeholder="介绍一下自己..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">位置</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="你在哪个城市？"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">网站</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="你的个人网站"
                />
              </div>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="预览" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-orange-400 text-2xl font-bold text-white">
                      {formData.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">自定义头像链接</label>
                <input
                  type="text"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">选择默认头像</label>
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => setFormData({ ...formData, avatarUrl: avatar })}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-xl border-2 transition',
                        formData.avatarUrl === avatar
                          ? 'border-cyan-500 ring-2 ring-cyan-200'
                          : 'border-slate-200 hover:border-cyan-300'
                      )}
                    >
                      <img src={avatar} alt={`默认头像 ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'header' && (
            <div className="space-y-6">
              <div
                className={cn(
                  'h-24 w-full rounded-xl bg-gradient-to-br',
                  formData.headerColor || 'from-cyan-400 via-emerald-400 to-orange-400'
                )}
                style={formData.headerImage ? { backgroundImage: `url(${formData.headerImage})`, backgroundSize: 'cover' } : {}}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">自定义背景图片</label>
                <input
                  type="text"
                  value={formData.headerImage}
                  onChange={(e) => setFormData({ ...formData, headerImage: e.target.value, headerColor: '' })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-slate-400">输入图片链接，留空则使用渐变色</p>
              </div>

              {!formData.headerImage && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">选择渐变色</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PRESET_HEADER_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient.class}
                        onClick={() => setFormData({ ...formData, headerColor: gradient.class, headerImage: '' })}
                        className={cn(
                          'relative h-16 rounded-xl bg-gradient-to-br transition',
                          gradient.class,
                          formData.headerColor === gradient.class
                            ? 'ring-2 ring-cyan-500 ring-offset-2'
                            : 'hover:scale-[1.02]'
                        )}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-md">
                          {gradient.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function getGradientFromName(name: string): string {
  const index = name.charCodeAt(0) % PRESET_HEADER_GRADIENTS.length
  return PRESET_HEADER_GRADIENTS[index].class
}