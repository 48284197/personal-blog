import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { z } from 'zod'
import {
  createSession,
  hashPassword,
  normalizeEmail,
  setSessionCookie,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_AVATARS = [
  'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699480272-generated-1776699479874-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699493854-generated-1776699493508-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699511642-generated-1776699510449-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699526593-generated-1776699526218-0.jpeg',
  'https://xuxiweii.s3.bitiful.net/uploads/1776699542554-generated-1776699542189-0.jpeg',
]

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).max(40),
})

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: '请输入有效的昵称、邮箱和至少 6 位密码' }, { status: 400 })
  }

  const email = normalizeEmail(parsed.data.email)
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser?.passwordHash) {
    return NextResponse.json({ message: '该邮箱已经注册，请直接登录' }, { status: 409 })
  }

  const passwordHash = hashPassword(parsed.data.password)
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          name: existingUser.name || parsed.data.name,
          avatarUrl: existingUser.avatarUrl || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
        },
      })
    : await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: parsed.data.name,
          avatarUrl: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
          role: 'USER',
          identityKind: 'CARBON',
        },
      })

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
  }, { status: 201 })
}
