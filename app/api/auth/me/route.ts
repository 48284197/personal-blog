import { NextRequest, NextResponse } from 'next/server'
import { syncCurrentPlatformUser, getSupabaseSessionUser } from '@/lib/platform-user'
import { getRequestUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const tokenUser = await getRequestUser(request)
  const sessionUser = tokenUser ?? await getSupabaseSessionUser()
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
