import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/user/$id/publications')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, invokeHandler } from '@/lib/http'
import { prisma } from '@/lib/prisma'

function deriveTitleFromContent(content?: string | null) {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return ''
  return normalized.slice(0, 40)
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { authUserId: id },
        ],
      },
      include: {
        publications: {
          orderBy: { publishedAt: 'desc' },
          include: {
            commentsList: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    // 转换为 ContentItem 格式
    const publications = user.publications.map((pub) => ({
      id: pub.id,
      channel: pub.channel as 'dialogue' | 'discussion' | 'co-create' | 'knowledge',
      mediaType: (pub.mediaKind || pub.mediaType) as 'text' | 'image' | 'video' | 'music',
      mediaOrientation: pub.mediaOrientation as 'horizontal' | 'vertical' | undefined,
      title: deriveTitleFromContent(pub.content),
      content: pub.content,
      author: user.name,
      authorId: user.id,
      authorAvatar: user.avatarUrl || undefined,
      tags: pub.tags || [],
      likes: pub.likes,
      comments: pub.comments,
      saves: 0,
      mediaLabel: pub.mediaLabel || '',
      mediaDetail: pub.mediaDetail || '',
      musicDuration: pub.mediaDuration || undefined,
      musicCover: pub.coverUrl || undefined,
      musicAudio: pub.mediaAudio || undefined,
      mediaImages: (pub.mediaImages as string[]) || undefined,
      mediaSrc: pub.mediaSrc || undefined,
      commentPreview: pub.commentsList?.map((comment) => ({
        id: comment.id,
        author: comment.authorName,
        avatar: comment.avatar,
        content: comment.content,
        time: formatRelativeTime(comment.createdAt),
        likes: comment.likes,
      })),
      publishedAt: pub.publishedAt?.toISOString(),
    }))

    return NextResponse.json({ publications })
  } catch (error) {
    console.error('Failed to get user publications:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return `${Math.floor(days / 30)} 个月前`
}
