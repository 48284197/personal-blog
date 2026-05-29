import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function getSupabaseSessionUser() {
  return getCurrentUser()
}

export async function syncCurrentPlatformUser(displayName?: string | null) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return null

  const name = displayName?.trim()
  if (!name || currentUser.name === name) return currentUser

  return prisma.user.update({
    where: { id: currentUser.id },
    data: { name },
  })
}
