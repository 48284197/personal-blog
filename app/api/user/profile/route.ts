import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function deriveTitleFromContent(content?: string | null) {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return '未命名内容'
  return normalized.slice(0, 40)
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    // 使用 Prisma 查询用户信息
    let user = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
    })

    // 如果用户不存在，创建新用户
    if (!user) {
      const defaultAvatars = [
        'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg',
        'https://xuxiweii.s3.bitiful.net/uploads/1776699480272-generated-1776699479874-0.jpeg',
        'https://xuxiweii.s3.bitiful.net/uploads/1776699493854-generated-1776699493508-0.jpeg',
        'https://xuxiweii.s3.bitiful.net/uploads/1776699511642-generated-1776699510449-0.jpeg',
        'https://xuxiweii.s3.bitiful.net/uploads/1776699526593-generated-1776699526218-0.jpeg',
        'https://xuxiweii.s3.bitiful.net/uploads/1776699542554-generated-1776699542189-0.jpeg',
      ]
      
      const name = authUser.user_metadata?.full_name || 
                   authUser.user_metadata?.name || 
                   authUser.email?.split('@')[0] || 
                   '用户'
      
      user = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: authUser.email,
          name,
          avatarUrl: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
          role: 'USER',
          identityKind: 'CARBON',
        },
      })
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
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, location, website, avatarUrl, headerColor, headerImage } = body

    const user = await prisma.user.update({
      where: { authUserId: authUser.id },
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
