import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const aiAccounts = await prisma.user.findMany({
      where: {
        role: 'AI_COMMENTATOR',
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isAiAccount: true,
        aiPrompt: true,
        aiActive: true,
        aiCommentDelay: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ aiAccounts })
  } catch (error) {
    console.error('获取AI账号列表失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取AI账号列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, avatarUrl, bio, aiPrompt, aiCommentDelay, isActive } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ message: 'AI账号名称不能为空' }, { status: 400 })
    }

    const aiAccount = await prisma.user.create({
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl || null,
        bio: bio || null,
        aiPrompt: aiPrompt || null,
        aiCommentDelay: aiCommentDelay || 5000,
        aiActive: isActive !== false,
        role: 'AI_COMMENTATOR',
        isAiAccount: true,
        identityKind: 'SILICON',
      },
    })

    return NextResponse.json({
      aiAccount: {
        id: aiAccount.id,
        name: aiAccount.name,
        avatarUrl: aiAccount.avatarUrl,
        bio: aiAccount.bio,
        isAiAccount: aiAccount.isAiAccount,
        aiPrompt: aiAccount.aiPrompt,
        aiActive: aiAccount.aiActive,
        aiCommentDelay: aiAccount.aiCommentDelay,
        createdAt: aiAccount.createdAt,
      },
    })
  } catch (error) {
    console.error('创建AI账号失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '创建AI账号失败' },
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
    const { id, name, avatarUrl, bio, aiPrompt, aiCommentDelay, aiActive } = body

    if (!id) {
      return NextResponse.json({ message: '缺少AI账号ID' }, { status: 400 })
    }

    const existingAccount = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingAccount || existingAccount.role !== 'AI_COMMENTATOR') {
      return NextResponse.json({ message: 'AI账号不存在' }, { status: 404 })
    }

    const updateData: {
      name?: string
      avatarUrl?: string | null
      bio?: string | null
      aiPrompt?: string | null
      aiCommentDelay?: number
      aiActive?: boolean
    } = {}

    if (name !== undefined) updateData.name = name.trim()
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (bio !== undefined) updateData.bio = bio
    if (aiPrompt !== undefined) updateData.aiPrompt = aiPrompt
    if (aiCommentDelay !== undefined) updateData.aiCommentDelay = aiCommentDelay
    if (aiActive !== undefined) updateData.aiActive = aiActive

    const updatedAccount = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      aiAccount: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        avatarUrl: updatedAccount.avatarUrl,
        bio: updatedAccount.bio,
        isAiAccount: updatedAccount.isAiAccount,
        aiPrompt: updatedAccount.aiPrompt,
        aiActive: updatedAccount.aiActive,
        aiCommentDelay: updatedAccount.aiCommentDelay,
        createdAt: updatedAccount.createdAt,
      },
    })
  } catch (error) {
    console.error('更新AI账号失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新AI账号失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: '缺少AI账号ID' }, { status: 400 })
    }

    const existingAccount = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingAccount || existingAccount.role !== 'AI_COMMENTATOR') {
      return NextResponse.json({ message: 'AI账号不存在' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除AI账号失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '删除AI账号失败' },
      { status: 500 }
    )
  }
}
