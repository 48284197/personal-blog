import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getUserProfileSummary } from '@/lib/feed-service'

function deriveTitleFromContent(content?: string | null) {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return '未命名内容'
  return normalized.slice(0, 40)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    // 获取用户发布的内容
    const publications = await prisma.publication.findMany({
      where: { authorId: user.id },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        content: true,
        mediaType: true,
        mediaImages: true,
        coverUrl: true,
        mediaSrc: true,
        publishedAt: true,
        likes: true,
        comments: true,
      },
    })

    const summary = await getUserProfileSummary(user.id, user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        website: user.website,
        headerColor: user.headerColor,
        headerImage: user.headerImage,
        createdAt: user.createdAt,
        followersCount: summary?.followersCount ?? 0,
        followingCount: summary?.followingCount ?? 0,
        likesCount: summary?.likesCount ?? 0,
      },
      contents: publications.map(item => ({
        id: item.id,
        title: deriveTitleFromContent(item.content),
        content: item.content,
        mediaType: item.mediaType,
        mediaImages: item.mediaImages as string[] | undefined,
        musicCover: item.coverUrl,
        mediaSrc: item.mediaSrc,
        publishedAt: item.publishedAt?.toISOString(),
        likes: item.likes || 0,
        comments: item.comments || 0,
      })),
    })
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取用户资料失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, location, website, avatarUrl, headerColor, headerImage } = body

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        bio,
        location,
        website,
        avatarUrl,
        headerColor,
        headerImage,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新用户资料失败' },
      { status: 500 }
    )
  }
}
