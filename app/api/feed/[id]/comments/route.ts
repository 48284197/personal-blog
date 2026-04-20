import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addFeedComment, listFeedComments } from '@/lib/feed-service'

const createCommentSchema = z.object({
  authorName: z.string().min(1),
  avatar: z.string().optional(),
  content: z.string().min(1),
  replyToName: z.string().nullable().optional(),
  mentions: z.array(z.string()).optional(),
})

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const comments = await listFeedComments(id)
  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()
  const parsed = createCommentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid comment payload', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await addFeedComment(id, parsed.data)
  return NextResponse.json(result, { status: 201 })
}

