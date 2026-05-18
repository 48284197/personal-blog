import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequestUser } from '@/lib/auth'
import { toggleFollowUser } from '@/lib/feed-service'

async function resolveCurrentDbUser(request: NextRequest) {
  const authUser = await getRequestUser(request)
  if (!authUser) return null

  let dbUser = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
  })

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        authUserId: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        avatarUrl: authUser.user_metadata?.avatar_url,
      },
    })
  }

  return dbUser
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentDbUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未授权，请先登录' }, { status: 401 })
    }

    const { id } = await params
    const result = await toggleFollowUser({
      followerId: currentUser.id,
      followingId: id,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '关注失败' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params })
}
