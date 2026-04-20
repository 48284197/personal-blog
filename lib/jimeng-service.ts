import crypto from 'crypto'

type JimengImageGenerationRequest = {
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_images?: number
  steps?: number
  guidance_scale?: number
  seed?: number
}

type JimengImageGenerationResponse = {
  request_id: string
  images: Array<{
    url: string
    base64?: string
  }>
}

export async function generateImageWithJimeng(
  input: JimengImageGenerationRequest
): Promise<JimengImageGenerationResponse> {
  const accessKeyId = process.env.JIMENG_ACCESS_KEY_ID
  const secretAccessKey = process.env.JIMENG_SECRET_ACCESS_KEY

  console.log('集梦API配置检查:', {
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
  })

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('缺少集梦生图凭证，请配置 JIMENG_ACCESS_KEY_ID 和 JIMENG_SECRET_ACCESS_KEY')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')

  // 构建请求体
  const requestBody = {
    prompt: input.prompt,
    negative_prompt: input.negative_prompt || '',
    width: input.width || 768,
    height: input.height || 768,
    num_images: input.num_images || 1,
    steps: input.steps || 30,
    guidance_scale: input.guidance_scale || 7.5,
    seed: input.seed || -1,
  }

  console.log('集梦API请求参数:', {
    prompt: requestBody.prompt,
    width: requestBody.width,
    height: requestBody.height,
    num_images: requestBody.num_images,
  })

  // 构建签名
  const canonicalRequest = buildCanonicalRequest(
    'POST',
    '/api/v1/image_generation',
    requestBody,
    timestamp,
    nonce
  )

  const signature = signRequest(canonicalRequest, secretAccessKey)

  console.log('开始调用集梦API...')

  // 发送请求
  try {
    const response = await fetch('https://api.jimeng.volcengine.com/api/v1/image_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': accessKeyId,
        'X-Timestamp': String(timestamp),
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('集梦API响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('集梦API错误响应:', errorText)
      throw new Error(`集梦生图 API 调用失败：${response.status} ${errorText}`)
    }

    const data = (await response.json()) as unknown
    console.log('集梦API返回数据:', data)
    
    return parseJimengResponse(data)
  } catch (error) {
    console.error('集梦API调用异常:', error)
    throw error
  }
}

function buildCanonicalRequest(
  method: string,
  path: string,
  body: Record<string, unknown>,
  timestamp: number,
  nonce: string
): string {
  const bodyStr = JSON.stringify(body)
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')

  return [method, path, bodyHash, timestamp, nonce].join('\n')
}

function signRequest(canonicalRequest: string, secretAccessKey: string): string {
  const decodedSecret = Buffer.from(secretAccessKey, 'base64').toString('utf-8')
  const signature = crypto
    .createHmac('sha256', decodedSecret)
    .update(canonicalRequest)
    .digest('base64')

  return signature
}

function parseJimengResponse(data: unknown): JimengImageGenerationResponse {
  const record = asRecord(data)

  if (record.error) {
    throw new Error(`集梦生图返回错误：${asString(record.error_msg) || '未知错误'}`)
  }

  const images = Array.isArray(record.images)
    ? record.images.map((img: unknown) => {
        const imgRecord = asRecord(img)
        return {
          url: asString(imgRecord.url) || '',
          base64: asString(imgRecord.base64),
        }
      })
    : []

  if (images.length === 0) {
    throw new Error('集梦生图未返回任何图像')
  }

  return {
    request_id: asString(record.request_id) || '',
    images,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
