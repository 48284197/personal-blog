import { NextResponse } from 'next/server'
import { syncCurrentPlatformUser, getSupabaseSessionUser } from '@/lib/platform-user'

export async function GET() {
  const sessionUser = await getSupabaseSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const user = await syncCurrentPlatformUser()
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
      role: user.role,
      identityKind: user.identityKind,
    },
  })
}
