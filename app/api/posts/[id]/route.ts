import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await prisma.post.findFirst({
      where: { id: parseInt(id), deletedAt: null },
      include: { tags: true, categories: true },
    })
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    return NextResponse.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, content, excerpt, coverImage, published, tags = [], categories = [], wasPublished } = body

    const tagOps = (tags as string[]).filter(Boolean).map((name) => ({
      where: { name: name.trim() },
      create: { name: name.trim(), slug: toSlug(name) },
    }))

    const categoryOps = (categories as string[]).filter(Boolean).map((name) => ({
      where: { name: name.trim() },
      create: { name: name.trim(), slug: toSlug(name) },
    }))

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        published: Boolean(published),
        publishedAt: published && !wasPublished ? new Date() : undefined,
        tags: { set: [], connectOrCreate: tagOps },
        categories: { set: [], connectOrCreate: categoryOps },
      },
      include: { tags: true, categories: true },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.post.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
