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

export async function selectGatewayProvider(model?: string | null) {
  const providers = await prisma.aiGatewayProvider.findMany({
    where: { isActive: true },
    include: {
      models: {
        where: { isActive: true },
      },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })

  if (providers.length === 0) return null

  if (model) {
    const exactModel = providers
      .flatMap((provider) => provider.models.map((item) => ({ provider, model: item })))
      .find((item) => item.model.publicModel === model)

    if (exactModel) {
      return {
        provider: exactModel.provider,
        upstreamModel: exactModel.model.upstreamModel,
      }
    }

    const prefixedProvider = providers.find(
      (provider) =>
        provider.routeStrategy === 'MODEL_PREFIX' &&
        provider.modelPrefix &&
        model.startsWith(provider.modelPrefix)
    )

    if (prefixedProvider) {
      return {
        provider: prefixedProvider,
        upstreamModel: model,
      }
    }
  }

  return {
    provider: providers[0],
    upstreamModel: model ?? undefined,
  }
}

export async function listGatewayModels() {
  const configuredModels = await prisma.aiGatewayModel.findMany({
    where: {
      isActive: true,
      provider: { isActive: true },
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          priority: true,
        },
      },
    },
    orderBy: [{ publicModel: 'asc' }],
  })

  return configuredModels.map((model) => ({
    id: model.publicModel,
    object: 'model',
    created: Math.floor(model.createdAt.getTime() / 1000),
    owned_by: model.provider.name,
  }))
}
