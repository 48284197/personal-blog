import { prisma } from '@/lib/prisma'

export type KnowledgeCategoryKey =
  | '新手指南'
  | '健康护理'
  | '行为训练'
  | '营养饮食'
  | '日常照顾'
  | '宠物心理'
  | '繁育知识'
  | '急救知识'

export type KnowledgeArticle = {
  id: string
  title: string
  category: KnowledgeCategoryKey
  summary: string
  content: string
  tags: string[]
  imageUrl?: string | null
  author: {
    id?: string
    name: string
    avatarUrl?: string | null
    title?: string | null
    followers: number
    isFollowing?: boolean
  }
  readTime: string
  createdAt: string
  source: {
    platform: string
    url: string
    authorName: string
    authorAvatar?: string | null
    title?: string | null
    coverUrl?: string | null
  }
}

export type KnowledgeCategory = {
  name: KnowledgeCategoryKey
  count: number
  color: string
}

export type KnowledgeTip = {
  title: string
  body: string
  imageUrl?: string | null
  sourceUrl: string
}

export type KnowledgeCreateCategoryOption = {
  value: KnowledgeCategoryKey
  label: KnowledgeCategoryKey
}

export type KnowledgeCreatePlatformOption = {
  value: string
  label: string
  color: string
}

export type KnowledgeCreateMeta = {
  categories: KnowledgeCreateCategoryOption[]
  platforms: KnowledgeCreatePlatformOption[]
}

export type KnowledgeHomeData = {
  featured: KnowledgeArticle[]
  latest: KnowledgeArticle[]
  categories: KnowledgeCategory[]
  tip: KnowledgeTip | null
  authors: KnowledgeArticle['author'][]
}

const categoryOrder: KnowledgeCategoryKey[] = [
  '新手指南',
  '健康护理',
  '行为训练',
  '营养饮食',
  '日常照顾',
  '宠物心理',
  '繁育知识',
  '急救知识',
]

const categoryColors: Record<KnowledgeCategoryKey, string> = {
  新手指南: 'text-emerald-600 bg-emerald-50',
  健康护理: 'text-rose-600 bg-rose-50',
  行为训练: 'text-lime-700 bg-lime-50',
  营养饮食: 'text-orange-600 bg-orange-50',
  日常照顾: 'text-cyan-600 bg-cyan-50',
  宠物心理: 'text-violet-600 bg-violet-50',
  繁育知识: 'text-amber-700 bg-amber-50',
  急救知识: 'text-red-600 bg-red-50',
}

export const sourcePlatforms = [
  { value: 'xiaohongshu', label: '小红书', color: 'bg-[#ff2442] text-white' },
  { value: 'douyin', label: '抖音', color: 'bg-[#111111] text-white' },
  { value: 'zhihu', label: '知乎', color: 'bg-[#056de8] text-white' },
  { value: 'bilibili', label: 'B站', color: 'bg-[#00a1d6] text-white' },
  { value: 'wechat', label: '公众号', color: 'bg-[#07c160] text-white' },
  { value: 'weibo', label: '微博', color: 'bg-[#ff8200] text-white' },
  { value: 'kuaishou', label: '快手', color: 'bg-[#ff5000] text-white' },
  { value: 'toutiao', label: '头条', color: 'bg-[#f04142] text-white' },
  { value: 'baijiahao', label: '百家号', color: 'bg-[#2932e1] text-white' },
  { value: 'youtube', label: 'YouTube', color: 'bg-[#ff0000] text-white' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-[#111111] text-white' },
] as const

export type SourcePlatformValue = typeof sourcePlatforms[number]['value']

export function getSourcePlatformMeta(platform?: string | null) {
  return sourcePlatforms.find((item) => item.value === platform || item.label === platform) ?? {
    value: platform || 'other',
    label: platform || '外部平台',
    color: 'bg-slate-900 text-white',
  }
}

export function getKnowledgeCreateMeta(): KnowledgeCreateMeta {
  return {
    categories: categoryOrder.map((category) => ({
      value: category,
      label: category,
    })),
    platforms: sourcePlatforms.map((platform) => ({
      value: platform.value,
      label: platform.label,
      color: platform.color,
    })),
  }
}

function inferPlatformFromUrl(url: string) {
  const normalized = url.toLowerCase()
  if (normalized.includes('xiaohongshu.com') || normalized.includes('xhslink.com')) return '小红书'
  if (normalized.includes('douyin.com')) return '抖音'
  if (normalized.includes('zhihu.com')) return '知乎'
  if (normalized.includes('bilibili.com') || normalized.includes('b23.tv')) return 'B站'
  if (normalized.includes('weixin.qq.com')) return '公众号'
  if (normalized.includes('weibo.com')) return '微博'
  if (normalized.includes('kuaishou.com')) return '快手'
  if (normalized.includes('toutiao.com')) return '头条'
  if (normalized.includes('baijiahao.baidu.com')) return '百家号'
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'YouTube'
  if (normalized.includes('tiktok.com')) return 'TikTok'
  return '外部平台'
}

function normalizeCategory(value?: string | null): KnowledgeCategoryKey {
  if (value && categoryOrder.includes(value as KnowledgeCategoryKey)) {
    return value as KnowledgeCategoryKey
  }
  return '新手指南'
}

function formatDate(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function estimateReadTime(text: string) {
  return `${Math.max(3, Math.ceil(text.length / 420))} 分钟`
}

export async function getKnowledgeHomeData(): Promise<KnowledgeHomeData> {
  const records = await prisma.knowledgeItem.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 24,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          bio: true,
          followers: { select: { id: true } },
        },
      },
    },
  })

  const articles = records.map((item): KnowledgeArticle => ({
    id: item.id,
    title: item.title,
    category: normalizeCategory(item.category),
    summary: item.summary,
    content: item.content,
    tags: item.tags,
    imageUrl: item.sourceCoverUrl,
    author: {
      id: item.author?.id,
      name: item.author?.name || item.sourceAuthorName || '',
      avatarUrl: item.author?.avatarUrl,
      title: item.author?.bio,
      followers: item.author?.followers.length ?? 0,
    },
    readTime: estimateReadTime(`${item.summary}${item.content}`),
    createdAt: formatDate(item.createdAt),
    source: {
      platform: item.sourcePlatform || inferPlatformFromUrl(item.sourceUrl || ''),
      url: item.sourceUrl || '#',
      authorName: item.sourceAuthorName || item.author?.name || '',
      authorAvatar: item.sourceAuthorAvatar,
      title: item.sourceTitle,
      coverUrl: item.sourceCoverUrl,
    },
  }))

  const categoryCounts = new Map<KnowledgeCategoryKey, number>()
  categoryOrder.forEach((category) => categoryCounts.set(category, 0))
  articles.forEach((article) => {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1)
  })

  const categories = categoryOrder.map((name) => ({
    name,
    count: categoryCounts.get(name) ?? 0,
    color: categoryColors[name],
  }))

  const authors = Array.from(
    new Map(
      articles
        .filter((article) => article.author.id || article.author.name)
        .map((article) => [article.author.id || article.author.name, article.author])
    ).values()
  ).slice(0, 4)

  const latest = articles.slice(4, 10).length ? articles.slice(4, 10) : articles.slice(0, 6)
  const latestTipSource = articles[0] ?? null
  const tip = latestTipSource
    ? {
        title: latestTipSource.title,
        body: latestTipSource.summary || latestTipSource.content.slice(0, 120),
        imageUrl: latestTipSource.imageUrl,
        sourceUrl: latestTipSource.source.url,
      }
    : null

  return {
    featured: articles.slice(0, 4),
    latest,
    categories,
    tip,
    authors,
  }
}
