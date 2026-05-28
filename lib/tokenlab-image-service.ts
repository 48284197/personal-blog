type TokenlabImageGenerationRequest = {
  prompt: string
  size?: string
  quality?: string
  outputFormat?: string
  outputCompression?: number
  n?: number
  imageUrls?: string[]
}

type TokenlabImageGenerationResponse = {
  request_id: string
  images: Array<{
    url: string
    base64?: string
  }>
}

const DEFAULT_BASE_URL = 'https://api.tokenlab.cc.cd/v1'
const DEFAULT_MODEL = 'gpt-image-2'
const VALID_SIZES = new Set([
  'auto',
  '1024x1024',
  '1536x1024',
  '1024x1536',
  '2048x2048',
  '2048x1152',
  '1152x2048',
  '3840x2160',
  '2160x3840',
])
const VALID_QUALITIES = new Set(['auto', 'low', 'medium', 'high'])
const VALID_OUTPUT_FORMATS = new Set(['png', 'jpeg', 'webp'])

export async function generateImageWithTokenlab(
  input: TokenlabImageGenerationRequest
): Promise<TokenlabImageGenerationResponse> {
  const apiKey = process.env.TOKENLAB_API_KEY?.trim()
  const baseUrl = (process.env.TOKENLAB_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
  const model = process.env.TOKENLAB_IMAGE_MODEL?.trim() || DEFAULT_MODEL
  const hasReferenceImages = Array.isArray(input.imageUrls) && input.imageUrls.filter(Boolean).length > 0

  if (!apiKey) {
    throw new Error('缺少 Tokenlab API Key，请配置 TOKENLAB_API_KEY')
  }

  if (hasReferenceImages) {
    return generateImageEdit(baseUrl, apiKey, model, input)
  }

  return generateTextToImage(baseUrl, apiKey, model, input)
}

async function generateTextToImage(
  baseUrl: string,
  apiKey: string,
  model: string,
  input: TokenlabImageGenerationRequest
): Promise<TokenlabImageGenerationResponse> {
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      n: normalizeCount(input.n),
      size: normalizeSize(input.size),
      quality: normalizeQuality(input.quality),
      output_format: normalizeOutputFormat(input.outputFormat),
      ...normalizeOutputCompression(input.outputCompression, input.outputFormat),
    }),
    signal: AbortSignal.timeout(120000),
  })

  return parseTokenlabResponse(response)
}

async function generateImageEdit(
  baseUrl: string,
  apiKey: string,
  model: string,
  input: TokenlabImageGenerationRequest
): Promise<TokenlabImageGenerationResponse> {
  const formData = new FormData()
  formData.append('model', model)
  formData.append('prompt', input.prompt)
  formData.append('n', String(normalizeCount(input.n)))
  formData.append('size', normalizeSize(input.size))
  formData.append('quality', normalizeQuality(input.quality))
  formData.append('output_format', normalizeOutputFormat(input.outputFormat))

  const compression = normalizeOutputCompression(input.outputCompression, input.outputFormat)
  if (typeof compression.output_compression === 'number') {
    formData.append('output_compression', String(compression.output_compression))
  }

  for (const [index, imageUrl] of (input.imageUrls || []).filter(Boolean).entries()) {
    const image = await fetchImageAsBlob(imageUrl, index)
    formData.append('image[]', image.blob, image.fileName)
  }

  const response = await fetch(`${baseUrl}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(120000),
  })

  return parseTokenlabResponse(response)
}

async function parseTokenlabResponse(response: Response): Promise<TokenlabImageGenerationResponse> {
  const rawText = await response.text()

  if (!response.ok) {
    throw new Error(`Tokenlab 生图调用失败: ${response.status} ${safeTrim(rawText, 240)}`)
  }

  const parsed = tryJsonParse(rawText)
  if (!isRecord(parsed) || !Array.isArray(parsed.data)) {
    throw new Error('Tokenlab 生图成功但响应格式异常')
  }

  const images = parsed.data
    .map((item) => {
      if (!isRecord(item)) return null
      const b64Json = asString(item.b64_json)
      const url = asString(item.url)
      if (b64Json) return { url: `data:image/png;base64,${b64Json}`, base64: b64Json }
      if (url) return { url }
      return null
    })
    .filter((item): item is { url: string; base64?: string } => Boolean(item))

  if (images.length === 0) {
    throw new Error('Tokenlab 生图成功但未返回图片')
  }

  return {
    request_id: asString(parsed.id) || `tokenlab-${Date.now()}`,
    images,
  }
}

async function fetchImageAsBlob(imageUrl: string, index: number) {
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) })

  if (!response.ok) {
    throw new Error(`参考图下载失败: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const blob = await response.blob()
  const extension = getExtensionFromContentType(contentType)

  return {
    blob,
    fileName: `reference-${index}.${extension}`,
  }
}

function normalizeCount(count?: number): number {
  if (!Number.isFinite(count)) return 1
  return Math.max(1, Math.min(1, Math.floor(count || 1)))
}

function normalizeSize(size?: string): string {
  const normalized = size?.trim()
  return normalized && VALID_SIZES.has(normalized) ? normalized : 'auto'
}

function normalizeQuality(quality?: string): string {
  const normalized = quality?.trim().toLowerCase()
  return normalized && VALID_QUALITIES.has(normalized) ? normalized : 'high'
}

function normalizeOutputFormat(outputFormat?: string): string {
  const normalized = outputFormat?.trim().toLowerCase()
  return normalized && VALID_OUTPUT_FORMATS.has(normalized) ? normalized : 'png'
}

function normalizeOutputCompression(outputCompression?: number, outputFormat?: string) {
  const format = normalizeOutputFormat(outputFormat)
  if (format === 'png' || !Number.isFinite(outputCompression)) return {}

  return {
    output_compression: Math.max(0, Math.min(100, Math.floor(outputCompression || 0))),
  }
}

function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes('jpeg')) return 'jpg'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('png')) return 'png'
  return 'png'
}

function safeTrim(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function tryJsonParse(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
