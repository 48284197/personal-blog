import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/notifications')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
      POST: ({ request, params }) => invokeHandler(POST, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { getRequestUser } from '@/lib/auth'
import { listNotifications, markNotificationsRead } from '@/lib/feed-service'

async function resolveCurrentDbUser(request: NextRequest) {
  return getRequestUser(request)
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
