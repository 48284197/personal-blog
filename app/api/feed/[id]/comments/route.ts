import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addFeedComment, listFeedCommentsWithLikeState } from '@/lib/feed-service'
import { getRequestUser } from '@/lib/auth'

const createCommentSchema = z.object({
  content: z.string().min(1),
  replyToName: z.string().nullable().optional(),
  mentions: z.array(z.string()).optional(),
})

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const requestUser = await getRequestUser(request)
  let dbUserId: string | null = null

  if (requestUser) {
    dbUserId = requestUser.id
  }

  const comments = await listFeedCommentsWithLikeState(id, dbUserId)
  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  // 获取当前用户
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json(
      { message: '未授权，请先登录' },
      { status: 401 }
    )
  }
  
  const body = await request.json()
  const parsed = createCommentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid comment payload', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await addFeedComment(id, {
    authorName: user.name,
    avatar: user.avatarUrl || user.name.slice(0, 1),
    content: parsed.data.content,
    replyToName: parsed.data.replyToName ?? null,
    mentions: parsed.data.mentions ?? [],
  })
  
  return NextResponse.json(result, { status: 201 })
}
