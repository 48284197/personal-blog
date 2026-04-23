type GrsaiImageGenerationRequest = {
  prompt: string
  size?: string
  variants?: number
  model?: string
}

type GrsaiImageGenerationResponse = {
  request_id: string
  images: Array<{
    url: string
    base64?: string
  }>
}

const DEFAULT_BASE_URL = 'https://api.grsai.com'
const DEFAULT_MODEL = 'gpt-image-1.5'

export async function generateImageWithGrsai(
  input: GrsaiImageGenerationRequest
): Promise<GrsaiImageGenerationResponse> {
  const apiKey = process.env.GRSAI_API_KEY?.trim()
  const baseUrl = (process.env.GRSAI_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
  const model = process.env.GRSAI_IMAGE_MODEL?.trim() || input.model || DEFAULT_MODEL

  if (!apiKey) {
    throw new Error('缺少 GrsAI API Key，请配置 GRSAI_API_KEY')
  }

  const payload = {
    model,
    prompt: input.prompt,
    size: input.size || '1:1',
    variants: normalizeVariants(input.variants),
  }

  const response = await fetch(`${baseUrl}/v1/draw/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  })

  const rawText = await response.text()

  if (!response.ok) {
    throw new Error(`GrsAI 生图调用失败: ${response.status} ${safeTrim(rawText, 240)}`)
  }

  const parsed = parseStreamingOrJsonResponse(rawText)
  if (parsed.images.length > 0) {
    return parsed
  }

  throw new Error('GrsAI 生图成功但未返回图片地址')
}

function normalizeVariants(variants?: number): number {
  if (!Number.isFinite(variants)) return 1
  return Math.max(1, Math.min(2, Math.floor(variants || 1)))
}

function parseStreamingOrJsonResponse(raw: string): GrsaiImageGenerationResponse {
  const images: string[] = []
  let requestId = `grsai-${Date.now()}`

  const pushImage = (url?: string) => {
    if (!url || typeof url !== 'string') return
    const trimmed = url.trim()
    if (!trimmed) return
    images.push(trimmed)
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return {
      request_id: requestId,
      images: [],
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.startsWith('data:') ? rawLine.slice(5).trim() : rawLine
    if (!line || line === '[DONE]') continue

    const obj = tryJsonParse(line)
    if (!obj) continue

    requestId = pickRequestId(obj) || requestId

    if (typeof obj.status === 'string' && obj.status.toLowerCase() === 'failed') {
      const message =
        asString(obj.message) ||
        asString(obj.error) ||
        asString(obj.errmsg) ||
        'GrsAI 任务失败'
      throw new Error(message)
    }

    pushImage(asString(obj.url))
    pushImage(asString(obj.image))

    if (Array.isArray(obj.urls)) {
      obj.urls.forEach((item) => pushImage(asString(item)))
    }

    if (Array.isArray(obj.images)) {
      obj.images.forEach((item) => {
        if (typeof item === 'string') {
          pushImage(item)
          return
        }
        if (isRecord(item)) {
          pushImage(asString(item.url) || asString(item.image_url))
        }
      })
    }

    if (Array.isArray(obj.data)) {
      obj.data.forEach((item) => {
        if (!isRecord(item)) return
        pushImage(asString(item.url) || asString(item.image_url))
      })
    }
  }

  const unique = [...new Set(images)]
  return {
    request_id: requestId,
    images: unique.map((url) => ({ url })),
  }
}

function pickRequestId(obj: Record<string, unknown>): string | undefined {
  return (
    asString(obj.request_id) ||
    asString(obj.task_id) ||
    asString(obj.id) ||
    asString(obj.draw_id)
  )
}

function tryJsonParse(input: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(input)
    return isRecord(value) ? value : null
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function safeTrim(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}
