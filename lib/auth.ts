import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import type { AppRequest } from './http'
import { prisma } from './prisma'

const SESSION_COOKIE = 'maoqiu_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const PASSWORD_KEY_LENGTH = 64

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false

  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) return false

  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH)
  const stored = Buffer.from(storedHash, 'hex')
  return stored.length === hash.length && timingSafeEqual(stored, hash)
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSessionCookie() {
  deleteCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function destroyCurrentSession(request?: AppRequest) {
  const cookieToken = request?.cookies.get(SESSION_COOKIE)?.value ?? getCookie(SESSION_COOKIE)
  if (cookieToken) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(cookieToken) } })
  }
  await clearSessionCookie()
}

export async function getCurrentUser(request?: AppRequest) {
  const cookieToken = request?.cookies.get(SESSION_COOKIE)?.value ?? getCookie(SESSION_COOKIE)
  if (!cookieToken) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(cookieToken) },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null)
    return null
  }

  return session.user
}

export async function requireCurrentUser(request?: AppRequest) {
  const user = await getCurrentUser(request)
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function getRequestUser(request: AppRequest) {
  return getCurrentUser(request)
}
