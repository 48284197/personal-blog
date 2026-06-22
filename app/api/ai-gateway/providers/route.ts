import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { resetGatewayBalanceFlagsIfNeeded } from '@/lib/ai-gateway'
import { prisma } from '@/lib/prisma'

function sanitizeProvider(provider: {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  priority: number
  isActive: boolean
  balanceInsufficient: boolean
  balanceInsufficientAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...provider,
    apiKey: provider.apiKey ? `${provider.apiKey.slice(0, 8)}...${provider.apiKey.slice(-4)}` : '',
  }
}

async function requireUser(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return null
  }
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  await resetGatewayBalanceFlagsIfNeeded()

  const providers = await prisma.aiGatewayProvider.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ providers: providers.map(sanitizeProvider) })
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const name = String(body.name ?? '').trim()
  const baseUrl = String(body.baseUrl ?? '').trim().replace(/\/+$/, '')
  const apiKey = String(body.apiKey ?? '').trim()

  if (!name || !baseUrl || !apiKey) {
    return NextResponse.json({ message: '名称、Base URL、上游 Key 都不能为空' }, { status: 400 })
  }

  const provider = await prisma.aiGatewayProvider.create({
    data: {
      name,
      baseUrl,
      apiKey,
      priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 100,
      isActive: body.isActive !== false,
      notes: body.notes ? String(body.notes).trim() : null,
    },
  })

  return NextResponse.json({ provider: sanitizeProvider(provider) })
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) {
    return NextResponse.json({ message: '缺少上游 ID' }, { status: 400 })
  }

  const existing = await prisma.aiGatewayProvider.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: '上游不存在' }, { status: 404 })
  }

  const updateData = {
    name: body.name !== undefined ? String(body.name).trim() : existing.name,
    baseUrl:
      body.baseUrl !== undefined
        ? String(body.baseUrl).trim().replace(/\/+$/, '')
        : existing.baseUrl,
    apiKey: body.apiKey ? String(body.apiKey).trim() : existing.apiKey,
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : existing.priority,
    isActive: body.isActive !== false,
    notes: body.notes ? String(body.notes).trim() : null,
  } as const

  const provider = await prisma.aiGatewayProvider.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ provider: sanitizeProvider(provider) })
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ message: '缺少上游 ID' }, { status: 400 })
  }

  await prisma.aiGatewayProvider.delete({ where: { id } })
  return NextResponse.json({ message: '删除成功' })
}
