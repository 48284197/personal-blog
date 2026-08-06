import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/feed/$id/like')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { getRequestUser } from '@/lib/auth'

// POST: 点赞 / 取消点赞 (toggle)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: publicationId } = await params
    
    // 获取当前用户
    const user = await getRequestUser(request)
    if (!user) {
      return NextResponse.json(
        { message: '未授权，请先登录' },
        { status: 401 }
      )
    }

    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId: user.id,
        },
      },
    })

    if (existingLike) {
      // 已经点赞了，取消点赞
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      // 更新点赞数
      const updatedPublication = await prisma.publication.update({
        where: { id: publicationId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      })

      return NextResponse.json({
        liked: false,
        likes: updatedPublication.likes,
      })
    } else {
      // 未点赞，添加点赞
      await prisma.like.create({
        data: {
          publicationId,
          userId: user.id,
        },
      })

      // 更新点赞数
      const updatedPublication = await prisma.publication.update({
        where: { id: publicationId },
        data: {
          likes: {
            increment: 1,
          },
        },
      })

      return NextResponse.json({
        liked: true,
        likes: updatedPublication.likes,
      })
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    )
  }
}

// GET: 获取点赞状态和点赞数
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: publicationId } = await params
    
    // 获取当前用户（可选）
    const user = await getRequestUser(request)
    
    // 获取点赞数
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      select: { likes: true },
    })

    if (!publication) {
      return NextResponse.json(
        { message: '内容不存在' },
        { status: 404 }
      )
    }

    let liked = false

    // 如果用户已登录，检查是否点赞
    if (user) {
      const existingLike = await prisma.like.findUnique({
        where: {
          publicationId_userId: {
            publicationId,
            userId: user.id,
          },
        },
      })
      liked = !!existingLike
    }

    return NextResponse.json({
      liked,
      likes: publication.likes,
    })
  } catch (error) {
    console.error('Failed to get like status:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
