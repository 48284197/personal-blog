import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateGatewayRequest,
  buildUpstreamUrl,
  listGatewayModels,
  selectGatewayProvider,
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

  if (request.method === 'GET' && pathname === 'models') {
    const data = await listGatewayModels()
    return NextResponse.json({ object: 'list', data })
  }

  const bodyJson = await readJsonBody(request)
  const requestedModel = typeof bodyJson?.model === 'string' ? bodyJson.model : null
  const selected = await selectGatewayProvider(requestedModel)

  if (!selected) {
    return jsonError('尚未配置可用的上游服务', 503)
  }

  let body: BodyInit | undefined
  if (bodyJson) {
    body = JSON.stringify({
      ...bodyJson,
      model: selected.upstreamModel ?? bodyJson.model,
    })
  } else if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer()
  }

  const upstreamUrl = buildUpstreamUrl(
    selected.provider.baseUrl,
    pathname,
    new URL(request.url).search
  )

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: createForwardHeaders(request, selected.provider.apiKey),
    body,
    cache: 'no-store',
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header)
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
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
