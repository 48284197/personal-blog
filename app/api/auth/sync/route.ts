import { NextResponse } from 'next/server'
import { syncCurrentPlatformUser } from '@/lib/platform-user'

export async function POST() {
  const user = await syncCurrentPlatformUser()

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const userWithKnowledgeFlag = user as typeof user & { isKnowledgeCreator?: boolean }

  return NextResponse.json({
    user: {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isKnowledgeCreator: userWithKnowledgeFlag.isKnowledgeCreator ?? false,
      role: user.role,
      identityKind: user.identityKind,
    },
  })
}
