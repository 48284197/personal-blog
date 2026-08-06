import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/feed/comments/$commentId/like')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { getRequestUser } from '@/lib/auth'
import { getFeedCommentLikeState, toggleFeedCommentLike } from '@/lib/feed-service'

async function ensureDbUser(request: NextRequest) {
  return getRequestUser(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const dbUser = await ensureDbUser(request)

    if (!dbUser) {
      return NextResponse.json(
        { message: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const result = await toggleFeedCommentLike(commentId, dbUser.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to toggle comment like:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '操作失败' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const dbUser = await ensureDbUser(request)
    const result = await getFeedCommentLikeState(commentId, dbUser?.id)

    if (!result) {
      return NextResponse.json(
        { message: '评论不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get comment like state:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
