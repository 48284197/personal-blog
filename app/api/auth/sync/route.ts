import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// 同步 Supabase Auth 用户到 Prisma 数据库，并返回完整用户信息
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {
        email: user.email!,
      },
      create: {
        supabaseId: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email!.split('@')[0],
        avatar: user.user_metadata?.avatar_url || null,
      },
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Auth sync error:', error)
    return NextResponse.json({ error: '同步失败' }, { status: 500 })
  }
}

// 获取当前登录用户信息
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新当前用户个人信息
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await req.json()
    const { name, bio, avatar } = body

    const dbUser = await prisma.user.update({
      where: { supabaseId: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
