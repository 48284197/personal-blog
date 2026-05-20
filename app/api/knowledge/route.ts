import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getKnowledgeHomeData, getSourcePlatformMeta } from '@/lib/knowledge-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'
import { getRequestUser } from '@/lib/auth'

const createKnowledgeSchema = z.object({
  sourceUrl: z.string().url(),
  sourcePlatform: z.string().optional(),
  sourceAuthorName: z.string().optional(),
  sourceAuthorAvatar: z.string().url().optional(),
  sourceTitle: z.string().optional(),
  sourceCoverUrl: z.string().url().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

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

function deriveTitle(input: { title?: string; sourceTitle?: string; sourcePlatform: string }) {
  return input.title?.trim() || input.sourceTitle?.trim() || `${input.sourcePlatform}养宠知识精选`
}

function deriveSummary(input: { summary?: string; content?: string; title: string; sourcePlatform: string }) {
  const summary = input.summary?.replace(/\s+/g, ' ').trim()
  if (summary) return summary.slice(0, 180)

  const content = input.content?.replace(/\s+/g, ' ').trim()
  if (content) return content.slice(0, 180)

  return `来自${input.sourcePlatform}的养宠内容导读，点击可前往原平台查看完整内容。`
}

async function getKnowledgePublisher(request: NextRequest) {
  const tokenUser = await getRequestUser(request)
  if (!tokenUser) return syncCurrentPlatformUser()

  const existingUser = await prisma.user.findUnique({
    where: { authUserId: tokenUser.id },
    select: { name: true, avatarUrl: true },
  })

  const derivedName =
    existingUser?.name?.trim() ||
    tokenUser.user_metadata?.full_name?.trim() ||
    tokenUser.user_metadata?.name?.trim() ||
    tokenUser.email?.split('@')[0]?.trim() ||
    '碳基用户'

  const avatarUrl =
    existingUser?.avatarUrl ||
    tokenUser.user_metadata?.avatar_url ||
    null

  return prisma.user.upsert({
    where: { authUserId: tokenUser.id },
    update: {
      email: tokenUser.email ?? null,
      name: derivedName,
      avatarUrl,
    },
    create: {
      authUserId: tokenUser.id,
      email: tokenUser.email ?? null,
      name: derivedName,
      avatarUrl,
      role: 'USER',
      identityKind: 'CARBON',
    },
  })
}

export async function GET() {
  try {
    const data = await getKnowledgeHomeData()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { message: '获取知识内容失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createKnowledgeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { message: '参数不完整', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const user = await getKnowledgePublisher(request)
    if (!user) {
      return NextResponse.json({ message: '请先登录后再发布知识引用' }, { status: 401 })
    }
    const userWithKnowledgeFlag = user as typeof user & { isKnowledgeCreator?: boolean }
    if (!userWithKnowledgeFlag.isKnowledgeCreator) {
      return NextResponse.json({ message: '当前用户不是知识创作者，无法发布知识' }, { status: 403 })
    }

    const platform = getSourcePlatformMeta(parsed.data.sourcePlatform || inferPlatformFromUrl(parsed.data.sourceUrl)).label
    const title = deriveTitle({
      title: parsed.data.title,
      sourceTitle: parsed.data.sourceTitle,
      sourcePlatform: platform,
    })
    const summary = deriveSummary({
      summary: parsed.data.summary,
      content: parsed.data.content,
      title,
      sourcePlatform: platform,
    })

    const item = await prisma.knowledgeItem.create({
      data: {
        title,
        category: parsed.data.category || '新手指南',
        summary,
        content: parsed.data.content?.trim() || summary,
        tags: parsed.data.tags ?? [],
        sourceType: 'external_reference',
        sourceUrl: parsed.data.sourceUrl,
        sourcePlatform: platform,
        sourceAuthorName: parsed.data.sourceAuthorName?.trim() || '原平台作者',
        sourceAuthorAvatar: parsed.data.sourceAuthorAvatar,
        sourceTitle: parsed.data.sourceTitle?.trim() || title,
        sourceCoverUrl: parsed.data.sourceCoverUrl,
        isPublic: true,
        authorId: user.id,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('创建知识引用失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建知识引用失败' },
      { status: 500 }
    )
  }
}
