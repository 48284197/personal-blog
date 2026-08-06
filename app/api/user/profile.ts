import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/user/profile')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
      PUT: ({ request, params }) => invokeHandler(PUT, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getUserProfileSummary } from '@/lib/feed-service'

function deriveTitleFromContent(content?: string | null) {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return '未命名内容'
  return normalized.slice(0, 40)
}

type PetInput = {
  name?: unknown
  type?: unknown
  breed?: unknown
  sex?: unknown
  birthday?: unknown
  age?: unknown
  neutered?: unknown
  weightKg?: unknown
  photoUrl?: unknown
  vaccineStatus?: unknown
  allergyHistory?: unknown
  notes?: unknown
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizePets(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item): PetInput => (item && typeof item === 'object' ? item : {}))
    .map((pet) => {
      const name = toOptionalString(pet.name)
      const type = toOptionalString(pet.type)
      const sex = toOptionalString(pet.sex) ?? '未知'
      const birthdayText = toOptionalString(pet.birthday)
      const weightText =
        typeof pet.weightKg === 'number'
          ? String(pet.weightKg)
          : toOptionalString(pet.weightKg)
      const parsedWeight = weightText ? Number(weightText) : null

      return {
        name,
        type,
        breed: toOptionalString(pet.breed),
        sex,
        birthday: birthdayText ? new Date(birthdayText) : null,
        age: toOptionalString(pet.age),
        neutered: Boolean(pet.neutered),
        weightKg: Number.isFinite(parsedWeight) ? parsedWeight : null,
        photoUrl: toOptionalString(pet.photoUrl),
        vaccineStatus: toOptionalString(pet.vaccineStatus),
        allergyHistory: toOptionalString(pet.allergyHistory),
        notes: toOptionalString(pet.notes),
      }
    })
    .filter((pet) => pet.name && pet.type && (!pet.birthday || !Number.isNaN(pet.birthday.getTime())))
    .slice(0, 12)
    .map((pet) => ({
      name: pet.name as string,
      type: pet.type as string,
      breed: pet.breed,
      sex: pet.sex,
      birthday: pet.birthday,
      age: pet.age,
      neutered: pet.neutered,
      weightKg: pet.weightKg,
      photoUrl: pet.photoUrl,
      vaccineStatus: pet.vaccineStatus,
      allergyHistory: pet.allergyHistory,
      notes: pet.notes,
    }))
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    // 获取用户发布的内容
    const publications = await prisma.publication.findMany({
      where: { authorId: user.id },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        content: true,
        mediaType: true,
        mediaImages: true,
        coverUrl: true,
        mediaSrc: true,
        publishedAt: true,
        likes: true,
        comments: true,
      },
    })

    const summary = await getUserProfileSummary(user.id, user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        website: user.website,
        headerColor: user.headerColor,
        headerImage: user.headerImage,
        createdAt: user.createdAt,
        followersCount: summary?.followersCount ?? 0,
        followingCount: summary?.followingCount ?? 0,
        likesCount: summary?.likesCount ?? 0,
        pets: summary?.pets ?? [],
      },
      contents: publications.map(item => ({
        id: item.id,
        title: deriveTitleFromContent(item.content),
        content: item.content,
        mediaType: item.mediaType,
        mediaImages: item.mediaImages as string[] | undefined,
        musicCover: item.coverUrl,
        mediaSrc: item.mediaSrc,
        publishedAt: item.publishedAt?.toISOString(),
        likes: item.likes || 0,
        comments: item.comments || 0,
      })),
    })
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取用户资料失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ message: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, location, website, avatarUrl, headerColor, headerImage } = body
    const pets = normalizePets(body.pets)

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        bio,
        location,
        website,
        avatarUrl,
        headerColor,
        headerImage,
      },
    })

    await prisma.pet
      .deleteMany({ where: { ownerId: currentUser.id } })
      .then(async () => {
        if (pets.length) {
          await prisma.pet.createMany({
            data: pets.map((pet) => ({
              ...pet,
              ownerId: currentUser.id,
            })),
          })
        }
      })
      .catch((error: { code?: string }) => {
        if (error.code === 'P2021') return
        throw error
      })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '更新用户资料失败' },
      { status: 500 }
    )
  }
}
