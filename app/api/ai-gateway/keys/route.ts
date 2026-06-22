import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createGatewayKey, hashGatewayKey } from '@/lib/ai-gateway'
import { prisma } from '@/lib/prisma'

async function requireUser(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return null
  return user
}

function sanitizeKey(key: {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    maskedKey: `${key.keyPrefix}...`,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const keys = await prisma.aiGatewayKey.findMany({
    orderBy: [{ createdAt: 'desc' }],
  })

  return NextResponse.json({ keys: keys.map(sanitizeKey) })
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  if (!name) {
    return NextResponse.json({ message: 'Key 名称不能为空' }, { status: 400 })
  }

  const plainKey = createGatewayKey()
  const key = await prisma.aiGatewayKey.create({
    data: {
      name,
      keyHash: hashGatewayKey(plainKey),
      keyPrefix: plainKey.slice(0, 18),
      isActive: body.isActive !== false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })

  return NextResponse.json({
    key: sanitizeKey(key),
    plainKey,
  })
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) {
    return NextResponse.json({ message: '缺少 Key ID' }, { status: 400 })
  }

  const key = await prisma.aiGatewayKey.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      expiresAt:
        body.expiresAt === ''
          ? null
          : body.expiresAt !== undefined
            ? new Date(body.expiresAt)
            : undefined,
    },
  })

  return NextResponse.json({ key: sanitizeKey(key) })
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ message: '缺少 Key ID' }, { status: 400 })
  }

  await prisma.aiGatewayKey.delete({ where: { id } })
  return NextResponse.json({ message: '删除成功' })
}
