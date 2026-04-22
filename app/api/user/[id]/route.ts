import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        location: true,
        website: true,
        headerColor: true,
        createdAt: true,
        _count: {
          select: {
            publications: true,
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

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        website: user.website,
        headerColor: user.headerColor,
        joinedAt: user.createdAt,
        postsCount: user._count.publications,
      },
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
