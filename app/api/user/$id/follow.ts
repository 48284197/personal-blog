import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/user/$id/follow')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
      DELETE: ({ request, params }) => invokeHandler(DELETE, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { getRequestUser } from '@/lib/auth'
import { toggleFollowUser } from '@/lib/feed-service'

async function resolveCurrentDbUser(request: NextRequest) {
  return getRequestUser(request)
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
