import { ContentType, NotificationType, Prisma, PublicationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  type ContentChannelKey,
  type ContentItem,
} from '@/lib/site-data'
import { triggerAiComments } from '@/lib/ai-comment-service'

export type FeedItemInput = {
  channel: ContentChannelKey
  content?: string
  authorName: string
  authorAvatar?: string
  authorId?: string | null
  mediaType: 'text' | 'image' | 'video' | 'music'
  mediaOrientation?: 'horizontal' | 'vertical'
  mediaLabel?: string
  mediaDetail?: string
  mediaImages?: string[]
  mediaAudio?: string
  mediaDuration?: string
  mediaSrc?: string
  tags?: string[]
}


export type HotTopicItem = {
  title: string
  count: number
  hot: boolean
}

export type SuggestedUserItem = {
  id: string
  name: string
  fans: number
  avatarUrl: string
  bio?: string
  followersCount?: number
  isFollowing?: boolean
}

export type ActivityItem = {
  id: string
  title: string
  time: string
  avatarUrl: string
  type: 'like' | 'publish' | 'follow' | 'comment'
  createdAt: Date
}

export type NotificationListItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  read: boolean
  time: string
  createdAt: string
}

export type SearchTopicItem = {
  id: string
  title: string
  description: string
  views: number
  discussions: number
}

export type SearchUserItem = {
  id: string
  name: string
  avatarUrl: string
  bio: string
  postsCount: number
  followersCount: number
  isFollowing: boolean
}

export type SearchContentItem = ContentItem

export type SearchResult = {
  query: string
  topics: SearchTopicItem[]
  users: SearchUserItem[]
  content: SearchContentItem[]
}

export type FeedCommentInput = {
  authorName: string
  avatar?: string
  content: string
  replyToName?: string | null
  mentions?: string[]
}

function deriveTitleFromSummary(summary?: string) {
  const normalized = summary?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return ''
  return normalized.slice(0, 40)
}

function formatCompactCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function toContentItem(publication: {
  id: string
  channel: string
  content: string
  authorName: string | null
  authorAvatar: string | null
  authorId: string | null
  tags: string[]
  likes: number
  comments: number
  saves: number
  mediaType: string
  mediaKind: string | null
  mediaOrientation: string | null
  mediaLabel: string | null
  mediaDetail: string | null
  mediaDuration: string | null
  mediaAudio: string | null
  coverUrl: string | null
  mediaSrc: string | null
  mediaImages: Prisma.JsonValue | null
  publishedAt?: Date
  commentsList?: Array<{
    id: string
    authorName: string
    avatar: string
    content: string
    replyToName: string | null
    likes: number
    createdAt: Date
    mentions: string[]
  }>
}): ContentItem {
  const normalizedContent = publication.content?.trim() ?? ''
  const derivedTitle = deriveTitleFromSummary(normalizedContent)

  return {
    id: publication.id,
    channel: publication.channel as ContentChannelKey,
    mediaType: mapDBMediaKind(
      publication.mediaKind ?? publication.mediaType,
      publication.mediaAudio ? 'music' : publication.mediaImages ? 'image' : 'video'
    ),
    mediaOrientation: publication.mediaOrientation as ContentItem['mediaOrientation'] | undefined,
    title: derivedTitle,
    content: normalizedContent,
    author: publication.authorName ?? '平台编辑',
    authorId: publication.authorId ?? undefined,
    authorAvatar: publication.authorAvatar ?? undefined,
    tags: publication.tags ?? [],
    likes: publication.likes ?? 0,
    comments: publication.comments ?? publication.commentsList?.length ?? 0,
    saves: publication.saves ?? 0,
    mediaLabel: publication.mediaLabel ?? '',
    mediaDetail: publication.mediaDetail ?? '',
    musicDuration: publication.mediaDuration ?? undefined,
    musicCover: publication.coverUrl ?? undefined,
    musicAudio: publication.mediaAudio ?? undefined,
    mediaImages: normalizeJsonArray(publication.mediaImages),
    mediaSrc: publication.mediaSrc ?? undefined,
    commentPreview: publication.commentsList?.slice(0, 3).map((comment) => ({
      id: comment.id,
      author: comment.authorName,
      avatar: comment.avatar,
      content: comment.content,
      time: formatRelativeTime(comment.createdAt),
      likes: comment.likes,
    })),
    publishedAt: publication.publishedAt ? formatRelativeTime(publication.publishedAt) : undefined,
  }
}

function normalizeJsonArray(value: Prisma.JsonValue | null): string[] | undefined {
  if (!value) return undefined
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

function mapSeedToDBType(channel: ContentChannelKey) {
  switch (channel) {
    case 'discussion':
      return PublicationType.DISCUSSION
    case 'co-create':
      return PublicationType.CO_CREATE
    case 'knowledge':
      return PublicationType.PK
    case 'dialogue':
    default:
      return PublicationType.DIALOGUE
  }
}

function mapMediaTypeToDB(mediaType: FeedItemInput['mediaType']) {
  switch (mediaType) {
    case 'text':
      return ContentType.TEXT
    case 'image':
      return ContentType.IMAGE
    case 'music':
      return ContentType.AUDIO
    case 'video':
      return ContentType.FILE
  }
}

function mapDBMediaKind(mediaKind: string, fallback: ContentItem['mediaType']) {
  if (mediaKind === 'text' || mediaKind === 'image' || mediaKind === 'video' || mediaKind === 'music') {
    return mediaKind
  }

  return fallback
}

export type FeedPageResult = {
  items: ContentItem[]
  hasMore: boolean
}

const publicationFeedSelect = {
  id: true,
  channel: true,
  content: true,
  authorName: true,
  authorAvatar: true,
  authorId: true,
  tags: true,
  likes: true,
  comments: true,
  mediaType: true,
  mediaKind: true,
  mediaOrientation: true,
  mediaLabel: true,
  mediaDetail: true,
  mediaDuration: true,
  mediaAudio: true,
  coverUrl: true,
  mediaSrc: true,
  mediaImages: true,
  publishedAt: true,
} satisfies Prisma.PublicationSelect

export async function listFeedItemsPage({
  limit = 10,
  offset = 0,
  channel,
}: {
  limit?: number
  offset?: number
  channel?: ContentChannelKey
} = {}): Promise<FeedPageResult> {
  const records = await prisma.publication.findMany({
    where: channel ? { channel } : undefined,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
    skip: offset,
    select: publicationFeedSelect,
  })

  const hasMore = records.length > limit
  const pageRecords = hasMore ? records.slice(0, limit) : records

  return {
    items: pageRecords.map((record) => toContentItem({
      ...record,
      saves: 0,
      mediaType: record.mediaType,
      mediaKind: record.mediaKind,
      mediaOrientation: record.mediaOrientation,
      mediaLabel: record.mediaLabel,
      mediaDetail: record.mediaDetail,
      mediaDuration: record.mediaDuration,
      mediaAudio: record.mediaAudio,
      coverUrl: record.coverUrl,
      mediaSrc: record.mediaSrc,
      mediaImages: record.mediaImages as Prisma.JsonValue | null,
      authorId: record.authorId,
    })),
    hasMore,
  }
}

export async function listFeedItems() {
  const { items } = await listFeedItemsPage()
  return items
}

export async function getFeedItemPageItem(record: {
  id: string
  channel: string
  content: string
  authorName: string | null
  authorAvatar: string | null
  authorId: string | null
  tags: string[]
  likes: number
  comments: number
  saves: number
  mediaType: string
  mediaKind: string | null
  mediaOrientation: string | null
  mediaLabel: string | null
  mediaDetail: string | null
  mediaDuration: string | null
  mediaAudio: string | null
  coverUrl: string | null
  mediaSrc: string | null
  mediaImages: Prisma.JsonValue | null
  publishedAt?: Date
}) {
  return toContentItem({
    ...record,
    saves: 0,
    mediaType: record.mediaType,
    mediaKind: record.mediaKind,
    mediaOrientation: record.mediaOrientation,
    mediaLabel: record.mediaLabel,
    mediaDetail: record.mediaDetail,
    mediaDuration: record.mediaDuration,
    mediaAudio: record.mediaAudio,
    coverUrl: record.coverUrl,
    mediaSrc: record.mediaSrc,
    mediaImages: record.mediaImages as Prisma.JsonValue | null,
    authorId: record.authorId,
  })
}

export async function getFeedItemById(id: string): Promise<ContentItem | null> {
  const record = await prisma.publication.findUnique({
    where: { id },
    include: {
      commentsList: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!record) return null

  return toContentItem({
    ...record,
    saves: 0,
    mediaType: record.mediaType,
    mediaKind: record.mediaKind,
    mediaOrientation: record.mediaOrientation,
    mediaLabel: record.mediaLabel,
    mediaDetail: record.mediaDetail,
    mediaDuration: record.mediaDuration,
    mediaAudio: record.mediaAudio,
    coverUrl: record.coverUrl,
    mediaSrc: record.mediaSrc,
    mediaImages: record.mediaImages as Prisma.JsonValue | null,
    authorId: record.authorId,
  })
}

export async function createFeedItem(input: FeedItemInput) {
  const trimmedContent = input.content?.trim() ?? ''
  const trimmedMediaDetail = input.mediaDetail?.trim() ?? ''

  const normalizedMediaDetail =
    trimmedMediaDetail && trimmedMediaDetail !== trimmedContent
      ? trimmedMediaDetail
      : null

  const record = await prisma.publication.create({
    data: {
      channel: input.channel,
      type: mapSeedToDBType(input.channel),
      content: trimmedContent,
      authorName: input.authorName,
      authorAvatar: input.authorAvatar ?? input.authorName.slice(0, 1),
      authorId: input.authorId ?? null,
      tags: input.tags ?? [],
      likes: 0,
      comments: 0,
      mediaType: mapMediaTypeToDB(input.mediaType),
      mediaKind: input.mediaType,
      mediaOrientation: input.mediaOrientation ?? null,
      mediaLabel: input.mediaLabel ?? null,
      mediaDetail: normalizedMediaDetail,
      mediaDuration: input.mediaDuration ?? null,
      mediaAudio: input.mediaAudio ?? null,
      mediaSrc: input.mediaSrc ?? null,
      mediaImages: input.mediaImages ?? undefined,
      coverUrl: input.mediaType === 'image' ? input.mediaSrc ?? input.mediaImages?.[0] ?? null : null,
    },
  })

  void triggerAiComments(record.id)

  return toContentItem({
    ...record,
    saves: 0,
    mediaType: record.mediaType,
    mediaKind: record.mediaKind,
    mediaOrientation: record.mediaOrientation,
    mediaLabel: record.mediaLabel,
    mediaDetail: record.mediaDetail,
    mediaDuration: record.mediaDuration,
    mediaAudio: record.mediaAudio,
    mediaSrc: record.mediaSrc,
    mediaImages: record.mediaImages as Prisma.JsonValue | null,
    commentsList: [],
  })
}

export async function listFeedComments(publicationId: string) {
  const comments = await prisma.publicationComment.findMany({
    where: { publicationId },
    orderBy: { createdAt: 'desc' },
  })

  return comments.map((comment) => ({
    id: comment.id,
    author: comment.authorName,
    avatar: comment.avatar,
    content: comment.content,
    time: formatRelativeTime(comment.createdAt),
    likes: comment.likes,
    replyToName: comment.replyToName ?? undefined,
    mentions: comment.mentions ?? [],
  }))
}

export async function listFeedCommentsWithLikeState(publicationId: string, userId?: string | null) {
  const comments = await prisma.publicationComment.findMany({
    where: { publicationId },
    orderBy: { createdAt: 'desc' },
    include: {
      likesList: {
        where: { userId: userId ?? '__anonymous__' },
        select: { id: true },
      },
    },
  })

  return comments.map((comment) => ({
    id: comment.id,
    author: comment.authorName,
    avatar: comment.avatar,
    content: comment.content,
    time: formatRelativeTime(comment.createdAt),
    likes: comment.likes,
    liked: userId ? (comment.likesList?.length ?? 0) > 0 : false,
    canLike: Boolean(userId),
    replyToName: comment.replyToName ?? undefined,
    mentions: comment.mentions ?? [],
  }))
}

export async function addFeedComment(publicationId: string, input: FeedCommentInput) {
  const created = await prisma.publicationComment.create({
    data: {
      publicationId,
      authorName: input.authorName,
      avatar: input.avatar ?? input.authorName.slice(0, 1),
      content: input.content,
      replyToName: input.replyToName ?? null,
      mentions: input.mentions ?? [],
    },
  })

  const updated = await prisma.publication.update({
    where: { id: publicationId },
    data: { comments: { increment: 1 } },
  })

  return {
    comment: {
      id: created.id,
      author: created.authorName,
      avatar: created.avatar,
      content: created.content,
      time: formatRelativeTime(created.createdAt),
      likes: created.likes,
      replyToName: created.replyToName ?? undefined,
      mentions: created.mentions ?? [],
    },
    commentsCount: updated.comments,
  }
}

export async function toggleFeedCommentLike(commentId: string, userId: string) {
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  })

  if (existingLike) {
    await prisma.commentLike.delete({
      where: { id: existingLike.id },
    })

    const updatedComment = await prisma.publicationComment.update({
      where: { id: commentId },
      data: {
        likes: {
          decrement: 1,
        },
      },
      select: {
        likes: true,
      },
    })

    return {
      liked: false,
      likes: updatedComment.likes,
    }
  }

  await prisma.commentLike.create({
    data: {
      commentId,
      userId,
    },
  })

  const updatedComment = await prisma.publicationComment.update({
    where: { id: commentId },
    data: {
      likes: {
        increment: 1,
      },
    },
    select: {
      likes: true,
    },
  })

  return {
    liked: true,
    likes: updatedComment.likes,
  }
}

export async function getFeedCommentLikeState(commentId: string, userId?: string | null) {
  const comment = await prisma.publicationComment.findUnique({
    where: { id: commentId },
    select: { likes: true },
  })

  if (!comment) {
    return null
  }

  if (!userId) {
    return {
      liked: false,
      likes: comment.likes,
    }
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  })

  return {
    liked: Boolean(existingLike),
    likes: comment.likes,
  }
}

export async function createFeedItemFromDraft(input: FeedItemInput) {
  return createFeedItem(input)
}

export type SidebarData = {
  hotTopics: HotTopicItem[]
  suggestedUsers: SuggestedUserItem[]
  activities: ActivityItem[]
}

export async function getSidebarData(currentUserId?: string | null): Promise<SidebarData>  {
  const [recentPublications, topUsers, latestComments] = await Promise.all([
    prisma.publication.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 120,
      select: {
        id: true,
        content: true,
        tags: true,
        publishedAt: true,
        authorName: true,
        authorAvatar: true,
      },
    }),
    prisma.user.findMany({
      take: 4,
      where: currentUserId ? { id: { not: currentUserId } } : undefined,
      orderBy: {
        publications: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            publications: true,
            followers: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    }),
    prisma.publicationComment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        authorName: true,
        avatar: true,
        createdAt: true,
        publication: {
          select: {
            content: true,
          },
        },
      },
    }),
  ])

  const topicCounter = new Map<string, number>()
  for (const publication of recentPublications) {
    const candidates = [
      ...publication.tags.map((tag) => tag.trim()),
    ].filter(Boolean) as string[]

    for (const candidate of candidates) {
      const normalized = candidate.replace(/^#/, '')
      if (!normalized) continue
      topicCounter.set(normalized, (topicCounter.get(normalized) ?? 0) + 1)
    }
  }

  const hotTopics = Array.from(topicCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count], index) => ({
      title,
      count,
      hot: index < 2,
    }))

  const suggestedUsers = topUsers.map((user) => ({
    id: user.id,
    name: user.name,
    fans: user._count.publications * 137,
    avatarUrl: user.avatarUrl ?? '',
    bio: user.bio ?? '',
    followersCount: user._count.followers,
    isFollowing: Array.isArray(user.followers) ? user.followers.length > 0 : false,
  }))

  const activities: ActivityItem[] = [
    ...recentPublications.slice(0, 5).map((publication) => ({
      id: `publication-${publication.id}`,
      title: `${publication.authorName ?? '平台编辑'} 发布了新内容`,
      time: formatRelativeTime(publication.publishedAt),
      avatarUrl: publication.authorAvatar ?? '',
      type: 'publish' as const,
      createdAt: publication.publishedAt,
    })),
    ...latestComments.map((comment) => ({
      id: `comment-${comment.id}`,
      title: `${comment.authorName} 评论了「${deriveTitleFromSummary(comment.publication.content) || '这条内容'}」`,
      time: formatRelativeTime(comment.createdAt),
      avatarUrl: comment.avatar,
      type: 'comment' as const,
      createdAt: comment.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)

  return {
    hotTopics: hotTopics.length > 0
      ? hotTopics
      : [
          { title: '欢迎来到内容广场', count: 12, hot: true },
          { title: '分享今天的新发现', count: 8, hot: true },
          { title: '一起完善社区内容区', count: 5, hot: false },
        ],
    suggestedUsers: suggestedUsers.length > 0
      ? suggestedUsers
      : [
          { id: 'fallback-user', name: '平台编辑', fans: 999, avatarUrl: '' },
        ],
    activities: activities.length > 0
      ? activities
      : [
          {
            id: 'fallback-activity',
            title: '内容区正在等待第一条动态',
            time: '刚刚',
            avatarUrl: '',
            type: 'publish',
            createdAt: new Date(),
          },
        ],
  }
}

export async function toggleFollowUser({
  followerId,
  followingId,
}: {
  followerId: string
  followingId: string
}) {
  if (followerId === followingId) {
    throw new Error('不能关注自己')
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId } }),
      prisma.follow.count({ where: { followerId } }),
    ])

    return {
      following: false,
      followersCount,
      followingCount,
    }
  }

  const [follower, following] = await Promise.all([
    prisma.user.findUnique({ where: { id: followerId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: followingId }, select: { id: true, name: true } }),
  ])

  if (!follower || !following) {
    throw new Error('用户不存在')
  }

  await prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  })

  await prisma.notification.create({
    data: {
      userId: followingId,
      type: NotificationType.FOLLOW,
      title: `${follower.name} 关注了你`,
      body: `去看看 ${follower.name} 的主页吧。`,
      actionUrl: `/user/${follower.id}`,
    },
  })

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId } }),
    prisma.follow.count({ where: { followerId } }),
  ])

  return {
    following: true,
    followersCount,
    followingCount,
  }
}

export async function listNotifications(userId: string): Promise<NotificationListItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return notifications.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    actionUrl: item.actionUrl ?? undefined,
    read: Boolean(item.readAt),
    time: formatRelativeTime(item.createdAt),
    createdAt: item.createdAt.toISOString(),
  }))
}

export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  if (notificationIds?.length) {
    await prisma.notification.updateMany({
      where: {
        userId,
        id: { in: notificationIds },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })
    return
  }

  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })
}

export async function searchCommunity(query: string, currentUserId?: string | null): Promise<SearchResult> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return {
      query: '',
      topics: [],
      users: [],
      content: [],
    }
  }

  const [publications, users] = await Promise.all([
    prisma.publication.findMany({
      where: {
        OR: [
          { content: { contains: trimmedQuery, mode: 'insensitive' } },
          { tags: { has: trimmedQuery } },
          { authorName: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: 24,
      include: {
        commentsList: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: trimmedQuery, mode: 'insensitive' } },
          { bio: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      take: 12,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        _count: {
          select: {
            publications: true,
            followers: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    }),
  ])

  const matchedTags = new Map<string, { views: number; discussions: number }>()
  publications.forEach((publication) => {
    publication.tags.forEach((tag) => {
      if (!tag.toLowerCase().includes(trimmedQuery.toLowerCase())) return
      const key = tag.replace(/^#/, '')
      const current = matchedTags.get(key) ?? { views: 0, discussions: 0 }
      current.views += Math.max(36, publication.likes * 24 + publication.comments * 12)
      current.discussions += Math.max(1, publication.comments)
      matchedTags.set(key, current)
    })
  })

  const topics = Array.from(matchedTags.entries())
    .slice(0, 12)
    .map(([title, stats]) => ({
      id: title,
      title: `# ${title}`,
      description: `围绕 ${title} 的宠物社区讨论`,
      views: stats.views,
      discussions: stats.discussions,
    }))

  return {
    query: trimmedQuery,
    topics,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
      bio: user.bio ?? '这个用户还没有填写简介。',
      postsCount: user._count.publications,
      followersCount: user._count.followers,
      isFollowing: Array.isArray(user.followers) ? user.followers.length > 0 : false,
    })),
    content: publications.slice(0, 12).map((publication) =>
      toContentItem({
        ...publication,
        saves: 0,
        mediaType: publication.mediaType,
        mediaKind: publication.mediaKind,
        mediaOrientation: publication.mediaOrientation,
        mediaLabel: publication.mediaLabel,
        mediaDetail: publication.mediaDetail,
        mediaDuration: publication.mediaDuration,
        mediaAudio: publication.mediaAudio,
        coverUrl: publication.coverUrl,
        mediaSrc: publication.mediaSrc,
        mediaImages: publication.mediaImages as Prisma.JsonValue | null,
        authorId: publication.authorId,
      })
    ),
  }
}

export async function getUserProfileSummary(targetUserId: string, currentUserId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      _count: {
        select: {
          publications: true,
          followers: true,
          following: true,
        },
      },
      followers: currentUserId
        ? {
            where: { followerId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  })

  if (!user) return null
  const userWithKnowledgeFlag = user as typeof user & { isKnowledgeCreator?: boolean }

  const likesAggregate = await prisma.publication.aggregate({
    where: { authorId: targetUserId },
    _sum: { likes: true },
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    isKnowledgeCreator: userWithKnowledgeFlag.isKnowledgeCreator ?? false,
    bio: user.bio,
    location: user.location,
    website: user.website,
    headerColor: user.headerColor,
    headerImage: user.headerImage,
    joinedAt: user.createdAt,
    postsCount: user._count.publications,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    likesCount: likesAggregate._sum.likes ?? 0,
    isFollowing: Array.isArray(user.followers) ? user.followers.length > 0 : false,
  }
}
