import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequestUser } from '@/lib/auth'
import { listNotifications, markNotificationsRead } from '@/lib/feed-service'

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

export async function GET(request: NextRequest) {
  const currentUser = await resolveCurrentDbUser(request)
  if (!currentUser) {
    return NextResponse.json({ message: '未授权，请先登录' }, { status: 401 })
  }

  const items = await listNotifications(currentUser.id)
  const unreadCount = items.filter((item) => !item.read).length
  return NextResponse.json({ items, unreadCount })
}

export async function POST(request: NextRequest) {
  const currentUser = await resolveCurrentDbUser(request)
  if (!currentUser) {
    return NextResponse.json({ message: '未授权，请先登录' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { ids?: string[] }
  await markNotificationsRead(currentUser.id, body.ids)
  return NextResponse.json({ success: true })
}
