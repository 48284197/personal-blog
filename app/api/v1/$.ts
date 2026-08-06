import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/v1/$')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, { path: params._splat?.split('/').filter(Boolean) ?? [] }),
      POST: ({ request, params }) => invokeHandler(POST, request, { path: params._splat?.split('/').filter(Boolean) ?? [] }),
      PUT: ({ request, params }) => invokeHandler(PUT, request, { path: params._splat?.split('/').filter(Boolean) ?? [] }),
      PATCH: ({ request, params }) => invokeHandler(PATCH, request, { path: params._splat?.split('/').filter(Boolean) ?? [] }),
      DELETE: ({ request, params }) => invokeHandler(DELETE, request, { path: params._splat?.split('/').filter(Boolean) ?? [] }),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import {
  authenticateGatewayRequest,
  buildUpstreamUrl,
  getAvailableGatewayProviders,
  isBalanceInsufficientError,
  markGatewayProviderBalanceInsufficient,
} from '@/lib/ai-gateway'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: { message, type: 'gateway_error' } }, { status })
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  try {
    return await request.clone().json()
  } catch {
    return null
  }
}

function createForwardHeaders(request: NextRequest, upstreamApiKey: string) {
  const headers = new Headers(request.headers)

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header)
  }

  headers.set('authorization', `Bearer ${upstreamApiKey}`)
  return headers
}

async function forwardToUpstream(request: NextRequest, context: RouteContext) {
  const gatewayKey = await authenticateGatewayRequest(request)
  if (!gatewayKey) {
    return jsonError('无效或缺失的网关 API Key', 401)
  }

  const { path } = await context.params
  const pathname = path.join('/')

  const bodyJson = await readJsonBody(request)
  const requestedModel = typeof bodyJson?.model === 'string' ? bodyJson.model : null
  const providers = await getAvailableGatewayProviders()

  if (providers.length === 0) {
    return jsonError('尚未配置可用的上游服务', 503)
  }

  let rawBody: ArrayBuffer | undefined
  if (!bodyJson && request.method !== 'GET' && request.method !== 'HEAD') {
    rawBody = await request.arrayBuffer()
  }

  let lastBalanceError: { body: string; status: number; statusText: string; headers: Headers } | null = null

  for (const provider of providers) {
    let body: BodyInit | undefined
    if (bodyJson) {
      body = JSON.stringify({
        ...bodyJson,
        model: requestedModel ?? bodyJson.model,
      })
    } else if (rawBody) {
      body = rawBody.slice(0)
    }

    const upstreamUrl = buildUpstreamUrl(
      provider.baseUrl,
      pathname,
      new URL(request.url).search
    )

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: createForwardHeaders(request, provider.apiKey),
      body,
      cache: 'no-store',
    })

    const responseHeaders = new Headers(upstreamResponse.headers)
    for (const header of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(header)
    }

    if (!upstreamResponse.ok) {
      const responseBody = await upstreamResponse.text()
      if (isBalanceInsufficientError(upstreamResponse.status, responseBody)) {
        await markGatewayProviderBalanceInsufficient(provider.id)
        lastBalanceError = {
          body: responseBody,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        }
        continue
      }

      return new Response(responseBody, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      })
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  }

  if (lastBalanceError) {
    return new Response(lastBalanceError.body, {
      status: lastBalanceError.status,
      statusText: lastBalanceError.statusText,
      headers: lastBalanceError.headers,
    })
  }

  return jsonError('没有可用的上游服务', 503)
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardToUpstream(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardToUpstream(request, context)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forwardToUpstream(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardToUpstream(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forwardToUpstream(request, context)
}
