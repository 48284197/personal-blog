import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createFeedItem, listFeedItemsPage } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'
import type { ContentChannelKey } from '@/lib/site-data'

const VALID_CHANNELS: ContentChannelKey[] = [
  'daily',
  'knowledge',
  'question',
  'goods',
  'story',
  'dialogue',
  'discussion',
  'co-create',
]

const createFeedSchema = z.object({
  channel: z.enum(VALID_CHANNELS).optional(),
  content: z.string().optional(),
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
  const channelParam = request.nextUrl.searchParams.get('channel')
  const followingOnly = request.nextUrl.searchParams.get('following') === '1'
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')
  const offset = Number(request.nextUrl.searchParams.get('offset') ?? '0')
  const channel = channelParam && VALID_CHANNELS.includes(channelParam as ContentChannelKey)
    ? (channelParam as ContentChannelKey)
    : undefined
  const currentUser = followingOnly ? await syncCurrentPlatformUser() : null

  const { items, hasMore } = await listFeedItemsPage({
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
    channel,
    followingUserId: followingOnly ? currentUser?.id ?? null : undefined,
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

  const trimmedContent = parsed.data.content?.trim() ?? ''
  const hasMedia =
    Boolean(parsed.data.mediaSrc?.trim()) ||
    Boolean(parsed.data.mediaAudio?.trim()) ||
    Boolean(parsed.data.mediaImages?.length)

  if (!trimmedContent && !hasMedia) {
    return NextResponse.json(
      { message: '请至少输入内容或上传媒体文件' },
      { status: 400 }
    )
  }

  const channel = parsed.data.channel ?? 'daily'
  const platformUser = await syncCurrentPlatformUser()

  const item = await createFeedItem({
    ...parsed.data,
    channel,
    content: trimmedContent,
    authorName: platformUser?.name ?? parsed.data.authorName ?? '平台编辑',
    authorAvatar: platformUser?.avatarUrl ?? parsed.data.authorAvatar,
    authorId: platformUser?.id,
  })
  return NextResponse.json({ item }, { status: 201 })
}
