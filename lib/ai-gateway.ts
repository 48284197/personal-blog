import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { prisma } from './prisma'

export const GATEWAY_KEY_PREFIX = 'sk-maoqiu'

export function createGatewayKey() {
  return `${GATEWAY_KEY_PREFIX}-${randomBytes(32).toString('base64url')}`
}

export function hashGatewayKey(key: string) {
  return createHash('sha256').update(key).digest('hex')
}

export function maskGatewayKey(prefix: string) {
  return `${prefix}...`
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? null
}

export async function authenticateGatewayRequest(request: NextRequest) {
  const token = getBearerToken(request)
  if (!token) return null

  const keyHash = hashGatewayKey(token)
  const gatewayKey = await prisma.aiGatewayKey.findUnique({
    where: { keyHash },
  })

  if (!gatewayKey || !gatewayKey.isActive) return null
  if (gatewayKey.expiresAt && gatewayKey.expiresAt.getTime() <= Date.now()) return null
  if (!safeEqual(gatewayKey.keyHash, keyHash)) return null

  await prisma.aiGatewayKey.update({
    where: { id: gatewayKey.id },
    data: { lastUsedAt: new Date() },
  })

  return gatewayKey
}

export function normalizeUpstreamBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '')
}

export function buildUpstreamUrl(baseUrl: string, pathname: string, search: string) {
  const cleanBaseUrl = normalizeUpstreamBaseUrl(baseUrl)
  const cleanPathname = pathname.replace(/^\/+/, '')
  const baseHasVersion = /\/v\d+$/i.test(cleanBaseUrl)
  const path = baseHasVersion ? cleanPathname : `v1/${cleanPathname}`
  return `${cleanBaseUrl}/${path}${search}`
}

function getMondayStart(date = new Date()) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() + diff)
  return monday
}

export async function resetGatewayBalanceFlagsIfNeeded() {
  const mondayStart = getMondayStart()

  await prisma.aiGatewayProvider.updateMany({
    where: {
      balanceInsufficient: true,
      balanceInsufficientAt: {
        lt: mondayStart,
      },
    },
    data: {
      balanceInsufficient: false,
      balanceInsufficientAt: null,
    },
  })
}

export async function getAvailableGatewayProviders() {
  await resetGatewayBalanceFlagsIfNeeded()

  return prisma.aiGatewayProvider.findMany({
    where: {
      isActive: true,
      balanceInsufficient: false,
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function selectGatewayProvider(model?: string | null) {
  const providers = await getAvailableGatewayProviders()

  if (providers.length === 0) return null

  return {
    provider: providers[0],
    upstreamModel: model ?? undefined,
  }
}

export async function markGatewayProviderBalanceInsufficient(providerId: string) {
  await prisma.aiGatewayProvider.update({
    where: { id: providerId },
    data: {
      balanceInsufficient: true,
      balanceInsufficientAt: new Date(),
    },
  })
}

export function isBalanceInsufficientError(status: number, responseBody: string) {
  const body = responseBody.toLowerCase()

  if (![400, 401, 402, 403, 429].includes(status)) return false

  return [
    'insufficient_quota',
    'insufficient quota',
    'insufficient balance',
    'not enough balance',
    'no balance',
    'balance not enough',
    'quota_exceeded',
    'billing',
    'payment required',
    '余额不足',
    '余额不够',
    '额度不足',
    '额度已用尽',
    '欠费',
    '账户余额',
  ].some((keyword) => body.includes(keyword))
}
