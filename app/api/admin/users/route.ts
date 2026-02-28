import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser?.isAdmin) return null
  return dbUser
}

// 获取所有用户列表
export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        canPublish: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { posts: true, comics: true } },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新用户权限
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

    const body = await req.json()
    const { id, canPublish, isAdmin } = body

    if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(canPublish !== undefined && { canPublish }),
        ...(isAdmin !== undefined && { isAdmin }),
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

// 删除用户
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })

    // 不允许删除自己
    if (id === admin.id) return NextResponse.json({ error: '不能删除自己' }, { status: 400 })

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
