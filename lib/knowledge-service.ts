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
  imageUrl: string
  author: {
    id?: string
    name: string
    avatarUrl: string
    title: string
    followers: number
    isFollowing?: boolean
  }
  views: number
  readTime: string
  createdAt: string
  source: {
    platform: string
    url: string
    authorName: string
    authorAvatar?: string
    title?: string
    coverUrl?: string
  }
}

export type KnowledgeCategory = {
  name: KnowledgeCategoryKey
  count: number
  color: string
}

export type KnowledgeHomeData = {
  featured: KnowledgeArticle[]
  latest: KnowledgeArticle[]
  categories: KnowledgeCategory[]
  tip: {
    title: string
    body: string
    imageUrl: string
  }
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

const imagePool = [
  'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1601758175576-648226072e90?auto=format&fit=crop&w=900&q=85',
]

const avatarPool = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80',
]

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

const fallbackArticles: KnowledgeArticle[] = [
  {
    id: 'starter-walk',
    title: '新手养狗必看！准备工作与注意事项',
    category: '新手指南',
    summary: '迎接狗狗回家前需要准备什么？从用品到心理准备，新手铲屎官的入门清单。',
    content: '从安全围栏、食盆、牵引绳到疫苗计划，先把生活环境和日常节奏搭起来，狗狗会更快适应新家。',
    tags: ['新手', '狗狗', '准备清单'],
    imageUrl: imagePool[0],
    author: { name: '宠物小课堂', avatarUrl: avatarPool[0], title: '资深猫狗护理师', followers: 12600 },
    views: 12600,
    readTime: '6 分钟',
    createdAt: '今天',
    source: { platform: '小红书', url: 'https://www.xiaohongshu.com', authorName: '宠物小课堂', coverUrl: imagePool[0] },
  },
  {
    id: 'cat-cold',
    title: '猫咪常见疾病及预防方法',
    category: '健康护理',
    summary: '了解猫咪常见疾病的症状与预防措施，帮助猫咪健康快乐成长。',
    content: '观察精神、食欲、饮水和排泄变化，定期驱虫和疫苗，是大多数健康问题的第一道防线。',
    tags: ['猫咪', '健康', '预防'],
    imageUrl: imagePool[1],
    author: { name: '喵星观察员', avatarUrl: avatarPool[1], title: '猫行为研究者', followers: 8900 },
    views: 8900,
    readTime: '8 分钟',
    createdAt: '2 小时前',
    source: { platform: '知乎', url: 'https://www.zhihu.com', authorName: '喵星观察员', coverUrl: imagePool[1] },
  },
  {
    id: 'puppy-training',
    title: '狗狗定点大小便训练技巧',
    category: '行为训练',
    summary: '简单有效的定点大小便训练方法，让你的狗狗更懂规矩、家里更清爽。',
    content: '固定地点、固定口令、固定奖励，把正确行为和即时反馈绑定起来，训练会更稳定。',
    tags: ['狗狗', '训练', '定点'],
    imageUrl: imagePool[2],
    author: { name: '训犬小达人', avatarUrl: avatarPool[2], title: '专业训犬师', followers: 7300 },
    views: 7300,
    readTime: '5 分钟',
    createdAt: '5 小时前',
    source: { platform: '抖音', url: 'https://www.douyin.com', authorName: '训犬小达人', coverUrl: imagePool[2] },
  },
  {
    id: 'food-choice',
    title: '如何为宠物选择合适的狗粮？',
    category: '营养饮食',
    summary: '从成分、营养、适口性等方面教你挑选适合宠物的主粮。',
    content: '优先看蛋白来源、脂肪比例和适龄标识，再结合体重、运动量与肠胃反应逐步调整。',
    tags: ['饮食', '主粮', '营养'],
    imageUrl: imagePool[3],
    author: { name: '营养师Petty', avatarUrl: avatarPool[3], title: '科学搭配宠物饮食', followers: 6100 },
    views: 6100,
    readTime: '7 分钟',
    createdAt: '昨天',
    source: { platform: 'B站', url: 'https://www.bilibili.com', authorName: '营养师Petty', coverUrl: imagePool[3] },
  },
  {
    id: 'spring-care',
    title: '春季宠物养护指南：这些问题要注意',
    category: '健康护理',
    summary: '春季是宠物疾病高发季节，注意预防皮肤病、过敏等问题，保持环境清洁很重要。',
    content: '换季时要关注皮肤状态、寄生虫预防和饮食过渡，外出回来也要及时清洁脚垫和毛发。',
    tags: ['春季', '护理', '过敏'],
    imageUrl: imagePool[4],
    author: { name: '宠物小课堂', avatarUrl: avatarPool[0], title: '资深猫狗护理师', followers: 12600 },
    views: 1200,
    readTime: '4 分钟',
    createdAt: '2 小时前',
    source: { platform: '公众号', url: 'https://mp.weixin.qq.com', authorName: '宠物小课堂', coverUrl: imagePool[4] },
  },
  {
    id: 'cat-purr',
    title: '猫咪为什么会呼噜？背后的含义你知道吗？',
    category: '宠物心理',
    summary: '解析猫咪踩奶行为的原因，这个可爱的动作隐藏着猫咪对你的信任和依赖。',
    content: '呼噜不只代表舒服，也可能是自我安抚。结合身体姿态和环境变化一起判断更可靠。',
    tags: ['猫咪', '心理', '行为'],
    imageUrl: imagePool[5],
    author: { name: '喵星观察员', avatarUrl: avatarPool[1], title: '猫行为研究者', followers: 8900 },
    views: 987,
    readTime: '5 分钟',
    createdAt: '5 小时前',
    source: { platform: '微博', url: 'https://weibo.com', authorName: '喵星观察员', coverUrl: imagePool[5] },
  },
  {
    id: 'dog-destroy',
    title: '狗狗拆家怎么办？3招教你有效改善',
    category: '行为训练',
    summary: '分析狗狗拆家的原因，并提供实用的解决方法，还你一个整洁的家。',
    content: '拆家常来自精力过剩、分离焦虑或无聊。增加消耗、提供咬胶和稳定作息是第一步。',
    tags: ['狗狗', '训练', '拆家'],
    imageUrl: imagePool[6],
    author: { name: '训犬小达人', avatarUrl: avatarPool[2], title: '专业训犬师', followers: 7300 },
    views: 2100,
    readTime: '5 分钟',
    createdAt: '昨天',
    source: { platform: '快手', url: 'https://www.kuaishou.com', authorName: '训犬小达人', coverUrl: imagePool[6] },
  },
]

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

function pseudoViews(id: string, index: number) {
  const seed = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return 860 + ((seed + index * 673) % 11800)
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
  }).catch(() => [])

  const articles = records.length
    ? records.map((item, index): KnowledgeArticle => ({
        id: item.id,
        title: item.title,
        category: normalizeCategory(item.category),
        summary: item.summary,
        content: item.content,
        tags: item.tags,
        imageUrl: item.sourceCoverUrl ?? imagePool[index % imagePool.length],
        author: {
          id: item.author?.id,
          name: item.author?.name ?? '宠物小课堂',
          avatarUrl: item.author?.avatarUrl ?? avatarPool[index % avatarPool.length],
          title: item.author?.bio ?? '宠物知识创作者',
          followers: item.author?.followers.length ?? pseudoViews(item.id, index),
        },
        views: pseudoViews(item.id, index),
        readTime: estimateReadTime(`${item.summary}${item.content}`),
        createdAt: formatDate(item.createdAt),
        source: {
          platform: item.sourcePlatform || inferPlatformFromUrl(item.sourceUrl || ''),
          url: item.sourceUrl || '#',
          authorName: item.sourceAuthorName || '原平台作者',
          authorAvatar: item.sourceAuthorAvatar ?? undefined,
          title: item.sourceTitle ?? undefined,
          coverUrl: item.sourceCoverUrl ?? undefined,
        },
      }))
    : fallbackArticles

  const categoryCounts = new Map<KnowledgeCategoryKey, number>()
  categoryOrder.forEach((category) => categoryCounts.set(category, 0))
  articles.forEach((article) => {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1)
  })

  const categories = categoryOrder.map((name, index) => ({
    name,
    count: Math.max(categoryCounts.get(name) ?? 0, [32, 58, 41, 47, 36, 23, 19, 15][index]),
    color: categoryColors[name],
  }))

  const authors = Array.from(
    new Map(articles.map((article) => [article.author.name, article.author])).values()
  ).slice(0, 4)

  return {
    featured: articles.slice(0, 4),
    latest: articles.slice(4, 7).length ? articles.slice(4, 7) : articles.slice(0, 3),
    categories,
    tip: {
      title: '每日小贴士',
      body: '定期给宠物梳毛不仅能减少掉毛，还能促进血液循环，增进你和宠物之间的感情。',
      imageUrl: imagePool[7],
    },
    authors,
  }
}
