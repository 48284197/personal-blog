import { IdentityKind, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

function getPlatformName(user: {
  email?: string | null
  user_metadata?: {
    full_name?: string | null
    name?: string | null
  } | null
}) {
  return (
    user.user_metadata?.full_name?.trim() ||
    user.user_metadata?.name?.trim() ||
    user.email?.split('@')[0]?.trim() ||
    '碳基用户'
  )
}

function getPlatformAvatar(name: string, avatarUrl?: string | null) {
  return avatarUrl?.trim() || name.slice(0, 1)
}

export async function getSupabaseSessionUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function syncCurrentPlatformUser() {
  const sessionUser = await getSupabaseSessionUser()
  if (!sessionUser) return null

  const name = getPlatformName(sessionUser)
  const avatarUrl = getPlatformAvatar(name, sessionUser.user_metadata?.avatar_url)

  return prisma.user.upsert({
    where: { authUserId: sessionUser.id },
    update: {
      email: sessionUser.email ?? null,
      name,
      avatarUrl,
    },
    create: {
      authUserId: sessionUser.id,
      email: sessionUser.email ?? null,
      name,
      avatarUrl,
      role: UserRole.USER,
      identityKind: IdentityKind.CARBON,
    },
  })
}
