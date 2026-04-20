import { ContentType, Prisma, PublicationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  type CommentItem,
  type ContentChannelKey,
  type ContentItem,
} from '@/lib/site-data'

export type FeedItemInput = {
  channel: ContentChannelKey
  topic: string
  title: string
  summary: string
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

export type FeedCommentInput = {
  authorName: string
  avatar?: string
  content: string
  replyToName?: string | null
  mentions?: string[]
}

function toContentItem(publication: {
  id: string
  channel: string
  topic: string | null
  title: string
  summary: string
  authorName: string | null
  authorAvatar: string | null
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
  return {
    id: publication.id,
    channel: publication.channel as ContentChannelKey,
    topic: publication.topic ?? publication.title,
    mediaType: mapDBMediaKind(
      publication.mediaKind ?? publication.mediaType,
      publication.mediaAudio ? 'music' : publication.mediaImages ? 'image' : 'video'
    ),
    mediaOrientation: publication.mediaOrientation as ContentItem['mediaOrientation'] | undefined,
    title: publication.title,
    summary: publication.summary,
    author: publication.authorName ?? '平台编辑',
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

export async function listFeedItems() {
  const records = await prisma.publication.findMany({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      commentsList: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  })

  return records.map((record) => toContentItem({
    ...record,
    saves: 0,
    topic: record.topic,
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
  }))
}

export async function createFeedItem(input: FeedItemInput) {
  const record = await prisma.publication.create({
    data: {
      channel: input.channel,
      topic: input.topic,
      type: mapSeedToDBType(input.channel),
      title: input.title,
      summary: input.summary,
      content: input.summary,
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
      mediaDetail: input.mediaDetail ?? null,
      mediaDuration: input.mediaDuration ?? null,
      mediaAudio: input.mediaAudio ?? null,
      mediaSrc: input.mediaSrc ?? null,
      mediaImages: input.mediaImages ?? undefined,
      coverUrl: input.mediaType === 'image' ? input.mediaSrc ?? input.mediaImages?.[0] ?? null : null,
    },
  })

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

export async function createFeedItemFromDraft(input: FeedItemInput) {
  return createFeedItem(input)
}
