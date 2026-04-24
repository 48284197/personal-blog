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

const DEFAULT_BASE_URL = 'https://grsaiapi.com'
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

  const parsed = parseStreamingOrJsonResponse(rawText, 'completions')
  if (parsed.images.length > 0) {
    return parsed
  }

  if (parsed.taskIds.length > 0) {
    const taskResult = await fetchResultByTaskId(baseUrl, apiKey, parsed.taskIds)
    if (taskResult.images.length > 0) {
      return taskResult
    }
  }

  if (parsed.lastErrorMessage) {
    throw new Error(parsed.lastErrorMessage)
  }

  throw new Error('GrsAI 生图成功但未返回图片地址')
}

function normalizeVariants(variants?: number): number {
  if (!Number.isFinite(variants)) return 1
  return Math.max(1, Math.min(2, Math.floor(variants || 1)))
}

type ParsedGrsaiResponse = GrsaiImageGenerationResponse & {
  taskIds: string[]
  lastErrorMessage?: string
}

function parseStreamingOrJsonResponse(raw: string, phase: 'completions' | 'result'): ParsedGrsaiResponse {
  const images: string[] = []
  const taskIds: string[] = []
  let requestId = `grsai-${Date.now()}`
  let lastErrorMessage: string | undefined

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
      taskIds: [],
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.startsWith('data:') ? rawLine.slice(5).trim() : rawLine
    if (!line || line === '[DONE]') continue

    const obj = tryJsonParse(line)
    if (!obj) continue

    requestId = pickRequestId(obj) || requestId
    pushTaskId(taskIds, obj)

    if (typeof obj.status === 'string' && obj.status.toLowerCase() === 'failed') {
      const message =
        asString(obj.message) ||
        asString(obj.error) ||
        asString(obj.errmsg) ||
        'GrsAI 任务失败'
      throw new Error(message)
    }

    const code = asNumber(obj.code)
    if (typeof code === 'number' && code !== 0) {
      lastErrorMessage =
        asString(obj.msg) ||
        asString(obj.message) ||
        asString(obj.error) ||
        `GrsAI ${phase} 调用失败，code=${code}`
      continue
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
    taskIds: [...new Set(taskIds)],
    lastErrorMessage,
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

function pushTaskId(taskIds: string[], obj: Record<string, unknown>) {
  const candidates = [
    asString(obj.task_id),
    asString(obj.request_id),
    asString(obj.id),
    asString(obj.draw_id),
  ]
  const data = isRecord(obj.data) ? obj.data : undefined
  if (data) {
    candidates.push(asString(data.task_id), asString(data.request_id), asString(data.id), asString(data.draw_id))
  }
  for (const id of candidates) {
    if (id && id.trim()) taskIds.push(id.trim())
  }
}

async function fetchResultByTaskId(baseUrl: string, apiKey: string, taskIds: string[]): Promise<GrsaiImageGenerationResponse> {
  const uniqueTaskIds = [...new Set(taskIds)].filter(Boolean)
  const timeoutAt = Date.now() + 45000
  let lastError: string | undefined

  while (Date.now() < timeoutAt) {
    for (const taskId of uniqueTaskIds) {
      const payloads: Array<Record<string, string>> = [
        { task_id: taskId },
        { id: taskId },
        { request_id: taskId },
        { draw_id: taskId },
      ]

      for (const payload of payloads) {
        const response = await fetch(`${baseUrl}/v1/draw/result`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        })

        const raw = await response.text()
        if (!response.ok) {
          lastError = `GrsAI 结果查询失败: ${response.status} ${safeTrim(raw, 200)}`
          continue
        }

        const parsed = parseStreamingOrJsonResponse(raw, 'result')
        if (parsed.images.length > 0) {
          return {
            request_id: parsed.request_id || taskId,
            images: parsed.images,
          }
        }

        if (parsed.lastErrorMessage) {
          lastError = parsed.lastErrorMessage
        }
      }
    }
    await sleep(1500)
  }

  if (lastError) {
    throw new Error(lastError)
  }

  return {
    request_id: uniqueTaskIds[0] || `grsai-${Date.now()}`,
    images: [],
  }
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

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeTrim(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}
