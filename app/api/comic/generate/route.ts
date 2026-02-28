import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { generateComicFromStory } from '@/lib/jimeng'

export async function POST(req: NextRequest) {
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    
    if (!supabaseUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { title, story, model, style, ratio } = await req.json()

    if (!title || !story) {
      return NextResponse.json({ error: '标题和故事内容不能为空' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const result = await generateComicFromStory(story, {
      model: model || 'jimeng-v1.4',
      style: style || 'anime',
      ratio: ratio || '16:9'
    })

    const comic = await prisma.comic.create({
      data: {
        title,
        story,
        images: result.images,
        model: model || 'jimeng-v1.4',
        style: style || 'anime',
        authorId: dbUser.id
      }
    })

    return NextResponse.json({
      success: true,
      comicId: comic.id,
      images: result.images,
      title: comic.title,
      story: comic.story,
      model: comic.model,
      style: comic.style
    })
  } catch (error) {
    console.error('生成漫画错误:', error)
    return NextResponse.json({ error: '生成漫画失败，请稍后重试' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    
    if (!supabaseUser) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const comics = await prisma.comic.findMany({
      where: { authorId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      comics: comics.map(comic => ({
        id: comic.id,
        title: comic.title,
        story: comic.story,
        images: comic.images,
        model: comic.model,
        style: comic.style,
        createdAt: comic.createdAt
      }))
    })
  } catch (error) {
    console.error('获取漫画列表错误:', error)
    return NextResponse.json({ error: '获取漫画列表失败' }, { status: 500 })
  }
}