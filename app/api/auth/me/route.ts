import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

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
