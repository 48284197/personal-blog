'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Settings,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Edit3,
  X,
  Camera,
  Loader2,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Music,
  FileText,
  Video,
  Palette,
} from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { Navbar } from '@/components/navbar'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

// 预设渐变背景
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

// 默认头像列表
const DEFAULT_AVATARS = [
  'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699480272-generated-1776699479874-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699493854-generated-1776699493508-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699511642-generated-1776699510449-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699526593-generated-1776699526218-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699542554-generated-1776699542189-0.jpeg',
]

type UserProfile = {
  id: string
  email: string | null
  name: string
  avatarUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  headerColor: string | null
  headerImage: string | null
  createdAt: string
}

type ContentItem = {
  id: string
  title: string
  summary: string
  mediaType: string
  mediaImages?: string[]
  musicCover?: string | null
  mediaSrc?: string | null
  publishedAt: string
  likes: number
  comments: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // 检查是否登录
      const supabase = createSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        window.location.href = '/login?redirect=/profile'
        return
      }

      // 使用 API 获取用户资料
      const response = await fetch('/api/user/profile')

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?redirect=/profile'
          return
        }
        throw new Error('获取用户资料失败')
      }

      const data = await response.json()
      setUser(data.user)
      setContents(data.contents || [])
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeaderStyle = () => {
    if (user?.headerImage) {
      return { backgroundImage: `url(${user.headerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    return {}
  }

  const getHeaderGradient = () => {
    if (user?.headerColor) {
      return user.headerColor
    }
    return 'from-cyan-400 via-emerald-400 to-orange-400'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <Navbar />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)]" />

      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* 用户信息卡片 - 新设计 */}
        <Surface className="overflow-hidden p-0">
          {/* 头部背景区域 */}
          <div
            className={cn(
              'relative h-40 sm:h-56 w-full bg-gradient-to-br',
              getHeaderGradient()
            )}
            style={getHeaderStyle()}
          >
            {user.headerImage && (
              <div className="absolute inset-0 bg-black/20" />
            )}

            {/* 设置按钮 */}
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

          {/* 用户信息区域 - 居中布局 */}
          <div className="relative px-6 pb-8 pt-0 sm:px-8">
            {/* 头像 - 居中重叠在头部下方 */}
            <div className="relative -mt-16 mb-4 flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-orange-400 text-4xl font-bold text-white">
                      {user.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 用户基本信息 - 居中 */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{user.name}</h1>
              <p className="mt-1 text-slate-500">@{user.email?.split('@')[0]}</p>

              {/* 简介 */}
              {user.bio && (
                <p className="mx-auto mt-4 max-w-lg text-slate-600">{user.bio}</p>
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
                  {new Date(user.createdAt).getFullYear()}年{new Date(user.createdAt).getMonth() + 1}月加入
                </span>
              </div>

              {/* 统计 */}
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{contents.length}</div>
                  <div className="text-sm text-slate-500">发布</div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {contents.reduce((sum, item) => sum + item.likes, 0)}
                  </div>
                  <div className="text-sm text-slate-500">获赞</div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {contents.reduce((sum, item) => sum + item.comments, 0)}
                  </div>
                  <div className="text-sm text-slate-500">评论</div>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        {/* 内容列表 */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">发布的内容</h2>

          {contents.length === 0 ? (
            <Surface className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">还没有发布任何内容</p>
             
            </Surface>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {contents.map((item) => (
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
          onUpdate={loadUserData}
          defaultAvatars={DEFAULT_AVATARS}
          presetGradients={PRESET_HEADER_GRADIENTS}
        />
      )}
    </main>
  )
}

function ContentCard({ item }: { item: ContentItem }) {
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

  return (
    <Link href={`/content/${item.id}`}>
      <Surface className="group overflow-hidden p-0 transition hover:shadow-lg">
        {/* 封面 */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {coverImage ? (
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
            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
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
  defaultAvatars,
  presetGradients,
}: {
  user: UserProfile
  onClose: () => void
  onUpdate: () => void
  defaultAvatars: string[]
  presetGradients: { name: string; class: string }[]
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
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">个人设置</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 标签页 */}
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

        {/* 内容区域 */}
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
              {/* 当前头像预览 */}
              <div className="flex justify-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100">
                  {formData.avatarUrl ? (
                    <Image
                      src={formData.avatarUrl}
                      alt="预览"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-orange-400 text-2xl font-bold text-white">
                      {formData.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>

              {/* 自定义头像链接 */}
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

              {/* 默认头像选择 */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">选择默认头像</label>
                <div className="grid grid-cols-3 gap-3">
                  {defaultAvatars.map((avatar, index) => (
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
                      <Image
                        src={avatar}
                        alt={`默认头像 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'header' && (
            <div className="space-y-6">
              {/* 当前背景预览 */}
              <div
                className={cn(
                  'h-24 w-full rounded-xl bg-gradient-to-br',
                  formData.headerColor || 'from-cyan-400 via-emerald-400 to-orange-400'
                )}
                style={formData.headerImage ? { backgroundImage: `url(${formData.headerImage})`, backgroundSize: 'cover' } : {}}
              />

              {/* 自定义背景图片 */}
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

              {/* 预设渐变色 */}
              {!formData.headerImage && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">选择渐变色</label>
                  <div className="grid grid-cols-2 gap-3">
                    {presetGradients.map((gradient) => (
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

        {/* 底部按钮 */}
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
