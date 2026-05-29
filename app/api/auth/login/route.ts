import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSession,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: '请输入有效的邮箱和密码' }, { status: 400 })
  }

  const email = normalizeEmail(parsed.data.email)
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ message: '邮箱或密码不正确' }, { status: 401 })
  }

  const { token, expiresAt } = await createSession(user.id)
  await setSessionCookie(token, expiresAt)

  return NextResponse.json({
    user: {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isKnowledgeCreator: user.isKnowledgeCreator,
      role: user.role,
      identityKind: user.identityKind,
    },
  })
}
