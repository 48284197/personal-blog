'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { 
  ArrowLeft, Settings, MapPin, Link as LinkIcon, Calendar, 
  FileText, Heart, MessageCircle, Image as ImageIcon, 
  Music, Video, Edit3, X, Camera, Palette, Loader2, Play, Pause 
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface, Badge } from '@/components/landing'
import { FollowButton } from '@/components/follow-button'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { ContentItem } from '@/lib/site-data'

// --- 预设常量 ---
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
  id: string; name: string; email: string | null; avatarUrl: string | null;
  isKnowledgeCreator: boolean;
  bio: string | null; location: string | null; website: string | null;
  headerColor: string | null; headerImage: string | null; joinedAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing: boolean;
}

// --- 动画配置 ---
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [publications, setPublications] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [followState, setFollowState] = useState<{ following: boolean; followersCount: number }>({
    following: false,
    followersCount: 0,
  })

  const isOwnProfile = currentUser?.id === id

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        const [meRes, uRes, pRes] = await Promise.all([
          session?.access_token
            ? fetch('/api/auth/me', {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              })
            : Promise.resolve(null),
          fetch(`/api/user/${id}`),
          fetch(`/api/user/${id}/publications`),
        ])

        if (meRes?.ok) {
          const meData = await meRes.json()
          if (meData?.user?.id) {
            setCurrentUser({ id: meData.user.id as string })
          }
        }

        if (uRes.ok) {
          const nextUser = (await uRes.json()).user as UserProfile
          setUser(nextUser)
          setFollowState({
            following: nextUser.isFollowing,
            followersCount: nextUser.followersCount,
          })
        }
        if (pRes.ok) setPublications((await pRes.json()).publications || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Loader2 className="h-8 w-8 text-cyan-600" />
      </motion.div>
    </div>
  )

  if (!user) return <div className="text-center py-20">用户不存在</div>

  const gradient = user.headerColor || getGradientFromName(user.name)
  const joinedDate = new Date(user.joinedAt)

  return (
    <main className="relative min-h-screen bg-[#f7fbff] pb-20">
      {/* 动态背景 */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(255,213,128,0.24),transparent_34%),radial-gradient(circle_at_top_right,rgba(254,240,198,0.3),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.08),transparent_34%),linear-gradient(180deg,#fffdf8_0%,#fbf6ed_44%,#f8f2e6_100%)]" />
      <div className="pointer-events-none fixed right-[8%] top-32 z-0 text-[#f5c233]/10">
        <PawPrintDecor />
      </div>
      <div className="pointer-events-none fixed left-[10%] bottom-24 z-0 scale-75 text-[#f0c362]/10">
        <PawPrintDecor />
      </div>

      <Navbar />

      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-24 sm:px-6">
        {/* 返回按钮 */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link href="/content" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 backdrop-blur-md transition hover:bg-white hover:text-cyan-600">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            返回社区
          </Link>
        </motion.div>

        {/* 用户资料卡片 */}
        <motion.div {...slideUp}>
          <Surface className="overflow-hidden p-0 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-xl">
            {/* Header Area */}
            <div className={cn('relative h-48 sm:h-64 w-full bg-gradient-to-br transition-all duration-700', gradient)}>
              {user.headerImage && <Image src={user.headerImage} alt="header" fill className="object-cover" priority />}
              <div className="absolute inset-0 bg-black/10" />
              
              {isOwnProfile && (
                <button onClick={() => setShowSettings(true)} className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md border border-white/30 transition hover:bg-white hover:text-slate-900">
                  <Settings className="h-4 w-4" />
                  编辑资料
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-10 sm:px-10">
              <div className="relative -mt-20 mb-6 flex flex-col items-center sm:items-start sm:flex-row sm:gap-6">
                <motion.div whileHover={{ scale: 1.05 }} className="rounded-full bg-white p-1.5 shadow-2xl">
                  <div className={cn('flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-4xl font-bold text-white', gradient)}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : user.name.slice(0, 2)}
                  </div>
                </motion.div>
                
                <div className="mt-4 text-center sm:mt-24 sm:text-left">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user.name}</h1>
                  <p className="text-slate-500 font-medium">@{user.email?.split('@')[0]}</p>
                  <div className="mt-3 flex justify-center sm:justify-start">
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
                        user.isKnowledgeCreator
                          ? 'bg-[#fff3d8] text-[#b87400]'
                          : 'bg-slate-100 text-slate-500',
                      ].join(' ')}
                    >
                      {user.isKnowledgeCreator ? '知识创作者' : '非知识创作者'}
                    </span>
                  </div>
                  {!isOwnProfile ? (
                    <div className="mt-4">
                      <FollowButton
                        userId={user.id}
                        initialFollowing={followState.following}
                        initialFollowersCount={followState.followersCount}
                        onChange={(next) => setFollowState(next)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  {user.bio && <p className="text-base text-slate-600 leading-relaxed">{user.bio}</p>}
                  
                  <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                    {user.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-cyan-500" />{user.location}</span>}
                    {user.website && (
                      <a href={user.website} target="_blank" className="flex items-center gap-1.5 text-cyan-600 hover:underline">
                        <LinkIcon className="h-4 w-4" />{user.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{joinedDate.getFullYear()}年加入</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 rounded-[28px] bg-white/75 p-6 shadow-[0_18px_40px_rgba(245,194,51,0.08)] lg:col-span-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{user.postsCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">发布</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{user.likesCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">获赞</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{followState.followersCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">粉丝</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{user.followingCount}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">关注</div>
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </motion.div>

        {/* 内容网格 */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">创作档案</h2>
            <div className="h-px flex-1 bg-slate-200 mx-6 opacity-50" />
          </div>

          {publications.length === 0 ? (
            <Surface className="py-20 text-center bg-transparent border-dashed border-2 border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">暂无公开的创作内容</p>
            </Surface>
          ) : (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.1 } }
              }}
              className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3"
            >
              {publications.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && user && (
          <SettingsModal 
            user={user} 
            onClose={() => setShowSettings(false)} 
            onUpdate={() => window.location.reload()} 
          />
        )}
      </AnimatePresence>
    </main>
  )
}

// --- 子组件：内容卡片 ---
function ContentCard({ item }: { item: ContentItem }) {
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const coverImage = item.mediaImages?.[0] || item.musicCover || item.mediaSrc
  const isVideo = item.mediaType === 'video'

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
      }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="break-inside-avoid"
    >
      <Link href={`/content/${item.id}`}>
        <Surface className="group overflow-hidden p-0 border-none shadow-sm hover:shadow-xl transition-all duration-500">
          <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
            {isVideo ? (
              <video ref={videoRef} src={item.mediaSrc} className="h-full w-full object-cover" muted playsInline />
            ) : (
              coverImage && <Image src={coverImage} alt={item.title || '内容封面'} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <Badge className="absolute left-3 top-3 bg-white/90 text-slate-900 border-none backdrop-blur-md">
              {item.mediaType === 'video' ? <Video className="h-3.5 w-3.5" /> : 
               item.mediaType === 'music' ? <Music className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            </Badge>
          </div>

          <div className="p-5">
            <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-1">{item.title || '这条内容'}</h3>
            <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.content}</p>
            
            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Heart className="h-3.5 w-3.5" /> {item.likes}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><MessageCircle className="h-3.5 w-3.5" /> {item.comments}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
        </Surface>
      </Link>
    </motion.div>
  )
}

// --- 子组件：设置弹窗 ---
function SettingsModal({ user, onClose, onUpdate }: { user: UserProfile; onClose: () => void; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'header'>('profile')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name, bio: user.bio || '', location: user.location || '',
    website: user.website || '', avatarUrl: user.avatarUrl || '',
    headerColor: user.headerColor || '', headerImage: user.headerImage || '',
  })
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const tabs: { id: 'profile' | 'avatar' | 'header'; label: string; icon: typeof Edit3 }[] = [
    { id: 'profile', label: '基础', icon: Edit3 },
    { id: 'avatar', label: '头像', icon: Camera },
    { id: 'header', label: '装扮', icon: Palette },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) { onUpdate(); onClose(); }
    } catch (e) { alert('保存失败'); }
    finally { setSaving(false); }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formDataPayload = new FormData()
      formDataPayload.append('files', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataPayload,
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? '上传失败')
      }

      const data = (await response.json()) as { files?: Array<{ url: string }> }
      const nextUrl = data.files?.[0]?.url
      if (nextUrl) {
        setFormData((current) => ({ ...current, avatarUrl: nextUrl }))
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '上传失败')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
          <h2 className="text-xl font-bold text-slate-900">账户设置</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex px-4 py-2 bg-slate-50/50">
          <LayoutGroup>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900">
                <tab.icon className="z-10 h-4 w-4" />
                <span className="z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 rounded-2xl bg-white shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </button>
            ))}
          </LayoutGroup>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-8 space-y-6">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">公开名称</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 font-medium outline-none focus:border-cyan-400 transition-all" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">个人简介</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 font-medium outline-none focus:border-cyan-400 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">地理位置</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 font-medium outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">个人网站</label>
                  <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 font-medium outline-none focus:border-cyan-400" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'avatar' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-cyan-100">
                <img src={formData.avatarUrl || user.avatarUrl || ''} alt="preview" className="h-full w-full object-cover" />
              </div>
              <div className="flex justify-center">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f5c233] px-5 py-2.5 text-sm font-bold text-[#2e1a14] shadow-[0_10px_24px_rgba(245,194,51,0.2)] transition hover:bg-[#efba18] disabled:opacity-60"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {uploadingAvatar ? '上传中...' : '上传头像'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {DEFAULT_AVATARS.map((url, i) => (
                  <button key={i} onClick={() => setFormData({ ...formData, avatarUrl: url })} className={cn("aspect-square rounded-2xl border-4 transition-all overflow-hidden hover:scale-105", formData.avatarUrl === url ? "border-cyan-400" : "border-transparent")}>
                    <img src={url} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <input type="text" value={formData.avatarUrl} onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })} placeholder="或输入外部头像链接..." className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 text-sm outline-none focus:border-cyan-400" />
            </motion.div>
          )}

          {activeTab === 'header' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div
                className={cn(
                  'relative h-32 w-full rounded-[24px] border-4 border-white shadow-lg bg-gradient-to-br',
                  formData.headerColor || 'from-cyan-400 via-emerald-400 to-orange-400'
                )}
                style={formData.headerImage ? { backgroundImage: `url(${formData.headerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!formData.headerImage ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-black/5 text-sm font-semibold text-white/90">
                    主页装扮预览
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_HEADER_GRADIENTS.map((g) => (
                  <button
                    key={g.class}
                    onClick={() => setFormData({ ...formData, headerColor: g.class, headerImage: '' })}
                    className={cn(
                      'h-14 rounded-xl bg-gradient-to-br transition-all hover:scale-[1.02]',
                      g.class,
                      formData.headerColor === g.class && 'ring-4 ring-cyan-100 border-2 border-white'
                    )}
                  />
                ))}
              </div>
              <input type="text" value={formData.headerImage} onChange={(e) => setFormData({ ...formData, headerImage: e.target.value, headerColor: '' })} placeholder="输入封面图链接..." className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-3 text-sm outline-none focus:border-cyan-400" />
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-8 py-6">
          <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600">放弃修改</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存设置'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function getGradientFromName(name: string): string {
  const index = name.charCodeAt(0) % PRESET_HEADER_GRADIENTS.length
  return PRESET_HEADER_GRADIENTS[index].class
}

function PawPrintDecor() {
  return (
    <div className="relative h-24 w-24">
      <span className="absolute left-8 top-0 h-6 w-6 rounded-full bg-current" />
      <span className="absolute left-0 top-10 h-5 w-5 rounded-full bg-current" />
      <span className="absolute right-0 top-10 h-5 w-5 rounded-full bg-current" />
      <span className="absolute left-10 top-8 h-5 w-5 rounded-full bg-current" />
      <span className="absolute left-4 top-12 h-14 w-16 rounded-[45%_45%_55%_55%] bg-current" />
    </div>
  )
}
