import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequestUser } from '@/lib/auth'

const publishMusicSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().optional(), // 正文内容，可选
  mediaAudio: z.string().min(1),
  coverUrl: z.string().optional(),
  mediaDuration: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = publishMusicSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: '参数不完整',
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const { title, summary, content, mediaAudio, coverUrl, mediaDuration, tags } = parsed.data

    // 获取当前用户
    const user = await getRequestUser(request)
    if (!user) {
      return NextResponse.json(
        {
          message: '未授权，请先登录',
        },
        { status: 401 }
      )
    }

    // 确保用户在数据库中存在
    let dbUser = await prisma.user.findUnique({
      where: { authUserId: user.id },
    })

    if (!dbUser) {
      // 如果用户不存在，创建一个新用户
      dbUser = await prisma.user.create({
        data: {
          authUserId: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatarUrl: user.user_metadata?.avatar_url,
        },
      })
    }

    // 创建 Publication 记录
    const publication = await prisma.publication.create({
      data: {
        channel: 'music-studio',
        title,
        type: 'CO_CREATE',
        mediaType: 'AUDIO',
        mediaKind: 'music',
        summary,
        content: content || '', // 正文为空字符串，不自动填充
        mediaAudio,
        coverUrl,
        mediaDuration,
        tags: tags || [],
        authorId: dbUser.id,
        authorName: dbUser.name,
        authorAvatar: dbUser.avatarUrl,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      publication,
    })
  } catch (error) {
    console.error('Failed to publish music:', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '发布失败',
      },
      { status: 500 }
    )
  }
}
