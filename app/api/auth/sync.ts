import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/auth/sync')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string }
  const name = body.name?.trim()
  const user = name
    ? await prisma.user.update({
        where: { id: currentUser.id },
        data: { name },
      })
    : currentUser

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
