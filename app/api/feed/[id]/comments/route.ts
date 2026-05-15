import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addFeedComment, listFeedComments } from '@/lib/feed-service'
import { getRequestUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  void request
  const comments = await listFeedComments(id)
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
  
  // 确保用户在数据库中存在
  let dbUser = await prisma.user.findUnique({
    where: { authUserId: user.id },
  })
  
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        authUserId: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatarUrl: user.user_metadata?.avatar_url,
      },
    })
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
    authorName: dbUser.name,
    avatar: dbUser.avatarUrl || dbUser.name.slice(0, 1),
    content: parsed.data.content,
    replyToName: parsed.data.replyToName ?? null,
    mentions: parsed.data.mentions ?? [],
  })
  
  return NextResponse.json(result, { status: 201 })
}
