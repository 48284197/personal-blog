import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequestUser } from '@/lib/auth'
import { triggerAiComments } from '@/lib/ai-comment-service'

const publishMusicSchema = z.object({
  content: z.string().min(1),
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

    const { content, mediaAudio, coverUrl, mediaDuration, tags } = parsed.data

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

    // 创建 Publication 记录
    const publication = await prisma.publication.create({
      data: {
        channel: 'music-studio',
        type: 'CO_CREATE',
        mediaType: 'AUDIO',
        mediaKind: 'music',
        content,
        mediaAudio,
        coverUrl,
        mediaDuration,
        tags: tags || [],
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatarUrl,
        publishedAt: new Date(),
      },
    })

    // 触发 AI 评论
    void triggerAiComments(publication.id)

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
