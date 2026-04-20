'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BrainCircuit,
  CirclePlus,
  MessageSquareText,
  PenLine,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import {
  contentChannels,
  contentStreams,
  interactivePrompts,
  interactionStats,
  type ContentChannelKey,
  type ContentItem,
} from '@/lib/site-data'
import { cn } from '@/lib/utils'

const channelIcons: Record<ContentChannelKey, typeof MessageSquareText> = {
  dialogue: MessageSquareText,
  discussion: BrainCircuit,
  'co-create': WandSparkles,
  knowledge: Sparkles,
}

const modelChoices = [
  '硅基-通用对话型',
  '硅基-科研分析型',
  '硅基-创意表达型',
]

export function InteractionHub() {
  const [activeChannel, setActiveChannel] = useState<ContentChannelKey>('dialogue')
  const [draft, setDraft] = useState('我想把一个产品想法整理成适合发布和讨论的内容卡片。')
  const [activeModel, setActiveModel] = useState(modelChoices[0])
  const [itemsByChannel, setItemsByChannel] = useState<Record<ContentChannelKey, ContentItem[]>>({
    dialogue: [],
    discussion: [],
    'co-create': [],
    knowledge: [],
  })

  const activeItems = itemsByChannel[activeChannel]

  useEffect(() => {
    let cancelled = false

    const loadChannel = async () => {
      try {
        const response = await fetch(`/api/feed?channel=${activeChannel}`)
        if (!response.ok) return

        const data = (await response.json()) as { items?: ContentItem[] }
        if (!cancelled && Array.isArray(data.items)) {
          setItemsByChannel((current) => ({
            ...current,
            [activeChannel]: data.items,
          }))
        }
      } catch {
        // error loading channel
      }
    }

    void loadChannel()

    return () => {
      cancelled = true
    }
  }, [activeChannel])

  const channelSummary = useMemo(
    () => contentChannels.find((channel) => channel.key === activeChannel),
    [activeChannel]
  )

  const handleQuickPrompt = (prompt: string) => {
    setDraft(prompt)
  }

  const handlePublish = () => {
    const content = draft.trim()
    if (!content) return

    const mediaType =
      activeChannel === 'discussion'
        ? 'video'
        : activeChannel === 'co-create'
          ? 'music'
          : 'image'

    const nextItem: ContentItem = {
      id: `${activeChannel}-${Date.now()}`,
      channel: activeChannel,
      mediaType,
      mediaOrientation:
        mediaType === 'video'
          ? activeChannel === 'knowledge'
            ? 'vertical'
            : 'horizontal'
          : undefined,
      title: content.slice(0, 26),
      summary: content,
      author: '你',
      tags: activeChannel === 'dialogue'
        ? ['即时对话', '发布']
        : activeChannel === 'discussion'
          ? ['研讨', '观点']
          : activeChannel === 'co-create'
            ? ['共创', '草稿']
            : ['知识', '沉淀'],
      likes: 0,
      comments: 0,
      saves: 0,
      mediaLabel:
        mediaType === 'video' ? '视频方式' : mediaType === 'music' ? '音乐方式' : '图片方式',
      mediaDetail:
        mediaType === 'video'
          ? '适合发短视频、讨论切片和直播回放。'
          : mediaType === 'music'
            ? '适合情绪、灵感、节奏感更强的内容表达。'
            : '适合分享照片、海报、截图和视觉灵感。',
      musicDuration: mediaType === 'music' ? '03:00' : undefined,
      musicCover:
        mediaType === 'music'
          ? 'https://ai6666.com/media/moments/2026/04/52f713b21cc42f1b.jpg'
          : undefined,
      musicAudio:
        mediaType === 'music'
          ? 'https://static.cop.jingheyijia.com/upload/2026-04-16/20260416134747.mp3'
          : undefined,
      mediaImages:
        mediaType === 'image'
          ? ['https://ai6666.com/media/moments/2026/04/52f713b21cc42f1b.jpg']
          : undefined,
      mediaSrc:
        mediaType === 'image'
          ? 'https://ai6666.com/media/moments/2026/04/52f713b21cc42f1b.jpg'
          : undefined,
    }

    void (async () => {
      try {
        const topic = draft.trim().slice(0, 24) || '未命名话题'
        const response = await fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: activeChannel,
            topic,
            title: nextItem.title,
            summary: nextItem.summary,
            authorName: '你',
            authorAvatar: '你',
            mediaType,
            mediaOrientation: nextItem.mediaOrientation,
            mediaLabel: nextItem.mediaLabel,
            mediaDetail: nextItem.mediaDetail,
            mediaImages: nextItem.mediaImages,
            mediaAudio: nextItem.mediaAudio,
            mediaDuration: nextItem.musicDuration,
            mediaSrc: nextItem.mediaSrc,
            tags: nextItem.tags,
          }),
        })

        if (!response.ok) throw new Error('create feed failed')

        const data = (await response.json()) as { item?: ContentItem }
        const savedItem = data.item ?? nextItem

        setItemsByChannel((current) => ({
          ...current,
          [activeChannel]: [savedItem, ...current[activeChannel]],
        }))
        setDraft('')
      } catch {
        setItemsByChannel((current) => ({
          ...current,
          [activeChannel]: [nextItem, ...current[activeChannel]],
        }))
        setDraft('')
      }
    })()
  }

  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="cyan">content interaction center</Badge>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              先把内容流跑起来，再把内容资产沉淀下去
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              这里不是单纯的介绍区，而是一个可切换、可发布、可收藏、可追问的内容交互面板。
              你可以把它理解成“内容广场 + 研讨区 + 共创台 + 知识库”的统一入口。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[340px]">
            {interactionStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">interaction modes</p>
            <div className="mt-4 space-y-3">
              {contentChannels.map((channel) => {
                const Icon = channelIcons[channel.key]
                const active = channel.key === activeChannel

                return (
                  <button
                    key={channel.key}
                    type="button"
                    onClick={() => setActiveChannel(channel.key)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      active
                        ? 'border-cyan-300/40 bg-cyan-400/10'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{channel.label}</p>
                        <span className={cn(
                          'h-2 w-2 rounded-full',
                          active ? 'bg-cyan-300' : 'bg-slate-500'
                        )} />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{channel.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">post composer</p>
                <h3 className="mt-2 text-lg font-semibold text-white">发布一条交互内容</h3>
              </div>
              <Badge tone={channelSummary?.accent ?? 'slate'}>{channelSummary?.label}</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {modelChoices.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setActiveModel(model)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-xs transition',
                    activeModel === model
                      ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                  )}
                >
                  {model}
                </button>
              ))}
            </div>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="写下你想发布、讨论、共创或沉淀的内容..."
              className="mt-4 min-h-36 w-full rounded-3xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-300/40"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePublish}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
              >
                <CirclePlus className="h-4 w-4" />
                发布到内容流
              </button>
              <button
                type="button"
                onClick={() => setDraft((value) => `${value ? `${value}\n\n` : ''}请硅基模型补充一个反方视角。`)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]"
              >
                <PenLine className="h-4 w-4" />
                邀请硅基补充
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {interactivePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">live stream</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{channelSummary?.label}</h3>
              </div>
              <Badge tone={channelSummary?.accent ?? 'slate'}>实时内容</Badge>
            </div>

            <div className="mt-4 space-y-4">
              {activeItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-300/30 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.mediaLabel}</p>
                      <h4 className="mt-2 text-lg font-semibold text-white">{item.title}</h4>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                      {item.mediaDetail}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-300">{item.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} tone="slate">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-400">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>{item.author}</span>
                      <span>·</span>
                      <span>点赞 {item.likes}</span>
                      <span>·</span>
                      <span>评论 {item.comments}</span>
                      <span>·</span>
                      <span>收藏 {item.saves}</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-cyan-200 transition hover:text-cyan-100"
                    >
                      查看详情
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">interaction</p>
              <p className="mt-2 text-lg font-semibold text-white">可讨论</p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                每条内容都能被评论、追问和重新展开。
              </p>
            </div>
            <div className="rounded-3xl border border-orange-400/20 bg-orange-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-200">co-create</p>
              <p className="mt-2 text-lg font-semibold text-white">可共创</p>
              <p className="mt-2 text-sm leading-6 text-orange-50/80">
                允许碳基用户和硅基模型一起继续编辑和扩写。
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">knowledge</p>
              <p className="mt-2 text-lg font-semibold text-white">可沉淀</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                高质量内容一键进入知识库和内容广场。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  )
}
