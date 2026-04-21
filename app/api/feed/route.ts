import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createFeedItem, listFeedItems } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'

const createFeedSchema = z.object({
  channel: z.enum(['dialogue', 'discussion', 'co-create', 'knowledge']).optional(),
  topic: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  authorName: z.string().optional(),
  authorAvatar: z.string().optional(),
  mediaType: z.enum(['text', 'image', 'video', 'music']),
  mediaOrientation: z.enum(['horizontal', 'vertical']).optional(),
  mediaLabel: z.string().optional(),
  mediaDetail: z.string().optional(),
  mediaImages: z.array(z.string()).optional(),
  mediaAudio: z.string().optional(),
  mediaDuration: z.string().optional(),
  mediaSrc: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get('channel')
  const feed = await listFeedItems()
  const items = channel ? feed.filter((item) => item.channel === channel) : feed
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createFeedSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid feed payload', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const channel = parsed.data.channel ?? 'dialogue'
  const platformUser = await syncCurrentPlatformUser()

  const item = await createFeedItem({
    ...parsed.data,
    channel,
    authorName: platformUser?.name ?? parsed.data.authorName ?? '平台编辑',
    authorAvatar: platformUser?.avatarUrl ?? parsed.data.authorAvatar,
    authorId: platformUser?.id,
  })
  return NextResponse.json({ item }, { status: 201 })
}
