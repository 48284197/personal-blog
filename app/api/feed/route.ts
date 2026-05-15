import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createFeedItem, listFeedItemsPage } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'
import type { ContentChannelKey } from '@/lib/site-data'

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

const VALID_CHANNELS: ContentChannelKey[] = ['dialogue', 'discussion', 'co-create', 'knowledge']

export async function GET(request: NextRequest) {
  const channelParam = request.nextUrl.searchParams.get('channel')
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')
  const offset = Number(request.nextUrl.searchParams.get('offset') ?? '0')
  const channel = channelParam && VALID_CHANNELS.includes(channelParam as ContentChannelKey)
    ? (channelParam as ContentChannelKey)
    : undefined

  const { items, hasMore } = await listFeedItemsPage({
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
    channel,
  })

  return NextResponse.json({ items, hasMore })
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
