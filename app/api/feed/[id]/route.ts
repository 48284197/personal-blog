import { NextRequest, NextResponse } from 'next/server'
import { getFeedItemById } from '@/lib/feed-service'
import { getRequestUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 获取内容
    const item = await getFeedItemById(id)

    if (!item) {
      return NextResponse.json(
        { message: '内容不存在' },
        { status: 404 }
      )
    }

    // 获取当前用户（可选）用于判断是否已点赞
    const user = await getRequestUser(request)
    let liked = false

    if (user) {
      const existingLike = await prisma.like.findUnique({
        where: {
          publicationId_userId: {
            publicationId: id,
            userId: user.id,
          },
        },
      })
      liked = !!existingLike
    }

    return NextResponse.json({
      item,
      liked,
    })
  } catch (error) {
    console.error('Failed to get feed item:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
