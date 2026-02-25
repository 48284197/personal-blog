import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        tags: true,
        categories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, excerpt, coverImage, published, tags = [], categories = [] } = body

    const tagOps = (tags as string[]).filter(Boolean).map((name) => ({
      where: { name: name.trim() },
      create: { name: name.trim(), slug: toSlug(name) },
    }))

    const categoryOps = (categories as string[]).filter(Boolean).map((name) => ({
      where: { name: name.trim() },
      create: { name: name.trim(), slug: toSlug(name) },
    }))

    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        published: Boolean(published),
        publishedAt: published ? new Date() : null,
        tags: { connectOrCreate: tagOps },
        categories: { connectOrCreate: categoryOps },
      },
      include: { tags: true, categories: true },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
