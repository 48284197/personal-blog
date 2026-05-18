// 默认头像列表 - AI 生成的可爱卡通头像
const DEFAULT_AVATARS = [
  'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg', // 机器人
  'https://xuxiweii.s3.bitiful.net/uploads/1776699480272-generated-1776699479874-0.jpeg', // 猫咪
  'https://xuxiweii.s3.bitiful.net/uploads/1776699493854-generated-1776699493508-0.jpeg', // 熊猫
  'https://xuxiweii.s3.bitiful.net/uploads/1776699511642-generated-1776699510449-0.jpeg', // 狐狸
  'https://xuxiweii.s3.bitiful.net/uploads/1776699526593-generated-1776699526218-0.jpeg', // 猫头鹰
  'https://xuxiweii.s3.bitiful.net/uploads/1776699542554-generated-1776699542189-0.jpeg', // 狗狗
]

function getRandomDefaultAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
}

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

function getPlatformAvatar(name: string, avatarUrl?: string | null, existingAvatarUrl?: string | null) {
  // 如果已有头像，保留它
  if (existingAvatarUrl && existingAvatarUrl.startsWith('http')) {
    return existingAvatarUrl
  }
  // 如果用户提供了头像，使用用户的
  if (avatarUrl?.trim()) {
    return avatarUrl.trim()
  }
  // 否则随机分配一个默认头像
  return getRandomDefaultAvatar()
}

export async function getSupabaseSessionUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function syncCurrentPlatformUser() {
  const sessionUser = await getSupabaseSessionUser()
  if (!sessionUser) return null

  const derivedName = getPlatformName(sessionUser)
  
  // 先查找现有用户，保留用户手动修改过的资料
  const existingUser = await prisma.user.findUnique({
    where: { authUserId: sessionUser.id },
    select: { avatarUrl: true, name: true }
  })

  const resolvedName = existingUser?.name?.trim() || derivedName
  
  const avatarUrl = getPlatformAvatar(
    resolvedName, 
    sessionUser.user_metadata?.avatar_url,
    existingUser?.avatarUrl
  )

  return prisma.user.upsert({
    where: { authUserId: sessionUser.id },
    update: {
      email: sessionUser.email ?? null,
      name: resolvedName,
      avatarUrl,
    },
    create: {
      authUserId: sessionUser.id,
      email: sessionUser.email ?? null,
      name: derivedName,
      avatarUrl,
      role: UserRole.USER,
      identityKind: IdentityKind.CARBON,
    },
  })
}
