import { Signer } from '@volcengine/openapi'

export interface ComicOptions {
  model?: string
  style?: string
  ratio?: string
  frames?: number
  watermark?: boolean
  prompt?: string
  image?: string | string[]
  sequential?: string
  max_images?: number
}

export interface ComicImage {
  url: string
  description: string
  frame: number
}

export interface ComicGenerationResponse {
  success: boolean
  images: ComicImage[]
  comicId?: string
}

// 定义消息内容类型
type MessageContent = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: MessageContent[] | string
}

type ChatRequest = {
  model: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
  extra_body?: {
    image_generation?: {
      aspect_ratio?: string
      num_images?: number
      watermark?: boolean
    }
  }
}

async function generateWithSeedream45(prompt: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  // 使用指定的API密钥
  const apiKey = process.env.ARK_API_KEY || 'ark-497c8a78-3032-4451-a1a7-8abfd8c87962-5e720'
  
  if (!apiKey) {
    throw new Error('缺少火山引擎方舟API密钥，请配置 ARK_API_KEY')
  }

  // 使用Ark API图片生成专用端点
  const host = 'ark.cn-beijing.volces.com'
  const endpoint = `/api/v3/images/generations`

  // 构建请求体 - 使用标准的images/generations格式
  const requestBody: any = {
    model: options.model || 'doubao-seedream-4-5-251128',
    prompt: prompt,
    n: options.frames || 1,  // 生成图片数量
    size: options.ratio ? mapRatioToSize(options.ratio) : '2048x2048',  // 尺寸
    response_format: 'url'  // 返回URL格式
  }

  // 如果有参考图，添加image参数（图生图）
  if (options.image) {
    if (Array.isArray(options.image)) {
      // 多张参考图
      requestBody.image_urls = options.image
    } else {
      // 单张参考图
      requestBody.image = options.image
    }
  }

  console.log('Sending request to Ark images/generations API:', {
    model: requestBody.model,
    prompt: prompt.substring(0, 50) + '...',
    n: requestBody.n,
    size: requestBody.size,
    hasImages: !!options.image
  })

  const response = await fetch(`https://${host}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    // 添加超时设置
    signal: AbortSignal.timeout(120000) // 120秒超时（图片生成较慢）
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Seedream 4.5 API错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`API错误: ${data.error.message || '未知错误'}`)
  }

  // 解析images/generations响应格式
  // 标准格式: { data: [{ url: "..." }, { url: "..." }], created: timestamp }
  const images: ComicImage[] = []
  
  // images/generations API返回data数组
  if (data.data && Array.isArray(data.data)) {
    data.data.forEach((item: any, index: number) => {
      if (item.url) {
        images.push({
          url: item.url,
          description: prompt,
          frame: index + 1
        })
      }
    })
  }
  
  // 备用：也检查其他可能的格式
  if (images.length === 0 && data.images && Array.isArray(data.images)) {
    data.images.forEach((item: any, index: number) => {
      const url = typeof item === 'string' ? item : item.url
      if (url) {
        images.push({
          url: url,
          description: prompt,
          frame: index + 1
        })
      }
    })
  }

  if (images.length === 0) {
    console.warn('未找到生成的图片，原始响应:', JSON.stringify(data, null, 2))
    throw new Error('图片生成成功但未获取到图片URL')
  }

  console.log('Successfully extracted images:', images.length)

  return {
    success: true,
    images,
    comicId: data.id || `seedream45_${Date.now()}`
  }
}

// 将比例转换为Seedream 4.5支持的尺寸
// Seedream 4.5要求至少3686400像素 (相当于2048x2048或更高)
function mapRatioToSize(ratio: string): string {
  const ratioMap: Record<string, string> = {
    '1:1': '2048x2048',     // 4,194,304 pixels ✓
    '4:3': '2048x1536',     // 3,145,728 pixels ✗ (太小)
    '3:4': '1536x2048',     // 3,145,728 pixels ✗ (太小)
    '16:9': '2048x1152',    // 2,359,296 pixels ✗ (太小)
    '9:16': '1152x2048',    // 2,359,296 pixels ✗ (太小)
    '3:2': '2048x1365',     // 2,799,360 pixels ✗ (太小)
    '2:3': '1365x2048',     // 2,799,360 pixels ✗ (太小)
    '21:9': '2048x880'      // 1,802,240 pixels ✗ (太小)
  }
  
  // 对于不满足最小像素要求的比例，使用2K分辨率并调整
  const minPixels = 3686400
  const defaultSize = '2048x2048'
  
  // 计算每个尺寸的像素数，如果不够则使用更大的尺寸
  const size = ratioMap[ratio] || defaultSize
  const [width, height] = size.split('x').map(Number)
  const pixels = width * height
  
  if (pixels < minPixels) {
    // 对于非1:1的比例，使用更大的分辨率来满足最小像素要求
    console.warn(`Size ${size} (${pixels} pixels) is below minimum requirement (${minPixels} pixels), using larger size`)
    
    // 根据比例计算合适的尺寸
    switch (ratio) {
      case '16:9':
        return '2560x1440'  // 3,686,400 pixels ✓ (2K 16:9)
      case '9:16':
        return '1440x2560'  // 3,686,400 pixels ✓ (2K 9:16)
      case '4:3':
        return '2400x1800'  // 4,320,000 pixels ✓
      case '3:4':
        return '1800x2400'  // 4,320,000 pixels ✓
      case '3:2':
        return '2400x1600'  // 3,840,000 pixels ✓
      case '2:3':
        return '1600x2400'  // 3,840,000 pixels ✓
      case '21:9':
        return '3200x1372'  // 4,390,400 pixels ✓ (满足最小要求)
      default:
        return defaultSize
    }
  }
  
  return size
}

// 保留旧版本API作为备用
async function generateWithLegacyVolcengine(prompt: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  const accessKeyId = process.env.VOLCENGINE_ACCESS_KEY_ID
  const secretKey = process.env.VOLCENGINE_SECRET_KEY

  if (!accessKeyId || !secretKey) {
    throw new Error('缺少火山引擎访问凭证，请配置 VOLCENGINE_ACCESS_KEY_ID 和 VOLCENGINE_SECRET_KEY')
  }

  const region = 'cn-north-1'
  const service = 'cv'
  const host = 'visual.volcengineapi.com'

  const request = {
    method: 'POST',
    protocol: 'https:',
    hostname: host,
    path: '/',
    region,
    params: {
      Action: 'CVSync2AsyncSubmitTask',
      Version: '2022-08-31',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      req_key: 'jimeng_t2i_v40',
      prompt: prompt,
      model: options.model || 'doubao-seedream-4-5-251128',
      style: options.style || 'anime',
      aspect_ratio: options.ratio || '16:9',
      image_num: options.frames || 1,
    }),
  }

  const signer = new Signer(request, service)
  signer.addAuthorization({ accessKeyId, secretKey })

  const url = `https://${host}/?${signer.request.params ? new URLSearchParams(signer.request.params).toString() : ''}`

  const response = await fetch(url, {
    method: 'POST',
    headers: signer.request.headers,
    body: signer.request.body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`火山引擎API错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (data.ResponseMetadata?.Error) {
    throw new Error(`API错误: ${data.ResponseMetadata.Error.Message || '未知错误'}`)
  }

  if (typeof data.code === 'number' && data.code !== 10000) {
    throw new Error(`API错误: ${data.message || '未知错误'}`)
  }

  const taskId = data.Result?.task_id || data.data?.task_id
  if (!taskId) {
    throw new Error('未获取到任务ID')
  }

  const imageUrl = await waitForTaskCompletion(accessKeyId, secretKey, taskId)

  return {
    success: true,
    images: [{
      url: imageUrl,
      description: prompt,
      frame: 1
    }],
    comicId: taskId
  }
}

async function waitForTaskCompletion(
  accessKeyId: string,
  secretKey: string,
  taskId: string,
  maxAttempts = 60,
  interval = 2000
): Promise<string> {
  const region = 'cn-north-1'
  const service = 'cv'
  const host = 'visual.volcengineapi.com'

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))

    const request = {
      method: 'POST',
      protocol: 'https:',
      hostname: host,
      path: '/',
      region,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        Action: 'CVSync2AsyncGetResult',
        Version: '2022-08-31',
      },
      body: JSON.stringify({
        req_key: 'jimeng_t2i_v40',
        task_id: taskId,
      }),
    }

    const signer = new Signer(request, service)
    signer.addAuthorization({ accessKeyId, secretKey })

    const queryString = signer.request.params ? new URLSearchParams(signer.request.params).toString() : ''
    const url = `https://${host}/?${queryString}`

    const response = await fetch(url, {
      method: 'POST',
      headers: signer.request.headers,
      body: signer.request.body,
    })

    const data: unknown = await response.json()
    const dataRecord = isRecord(data) ? data : {}

    if (typeof dataRecord.code === 'number' && dataRecord.code !== 10000) {
      throw new Error(`任务失败: ${getText(dataRecord.message) || '未知错误'}`)
    }

    const result = isRecord(dataRecord.Result)
      ? dataRecord.Result
      : isRecord(dataRecord.data)
        ? dataRecord.data
        : {}

    const taskStatus =
      getText(result.task_status) ||
      getText(result.status)

    if (taskStatus === 'SUCCEED' || taskStatus === 'done') {
      const output = isRecord(result.output) ? result.output : result

      let imageUrl =
        firstText(output.image_urls) ||
        firstImageUrl(output.images) ||
        (isRecord(output.result) ? firstText(output.result.image_urls) : undefined) ||
        (isRecord(output.result) ? firstImageUrl(output.result.images) : undefined) ||
        firstText(dataRecord.image_urls) ||
        firstImageUrl(dataRecord.images)

      let base64Image: string | undefined =
        getText(output.image_base64) ||
        firstBase64(output.images) ||
        (isRecord(output.result) ? getText(output.result.image_base64) : undefined) ||
        (isRecord(output.result) ? firstBase64(output.result.images) : undefined)

      if (!imageUrl && !base64Image) {
        const visited = new Set<unknown>()
        const stack: unknown[] = [data]

        while (stack.length) {
          const current = stack.pop()
          if (!current || typeof current !== 'object' || visited.has(current)) continue
          visited.add(current)

          for (const value of Object.values(current as Record<string, unknown>)) {
            if (typeof value === 'string') {
              if (
                /^https?:\/\//.test(value) &&
                (/(\.(png|jpg|jpeg|webp|gif|bmp))/i.test(value) || value.includes('volcengine'))
              ) {
                imageUrl = value
                break
              }

              if (
                !imageUrl &&
                !base64Image &&
                value.length > 500 &&
                /^[A-Za-z0-9+/=\r\n]+$/.test(value)
              ) {
                base64Image = value.replace(/\r?\n/g, '')
              }
            } else if (value && typeof value === 'object') {
              stack.push(value)
            }
          }

          if (imageUrl || base64Image) break
        }
      }

      if (imageUrl) {
        return imageUrl
      }

      if (base64Image) {
        return `data:image/png;base64,${base64Image}`
      }

      console.error('火山引擎任务成功但未获取到图片URL，原始响应:', JSON.stringify(dataRecord))
      throw new Error('任务成功但未获取到图片URL')
    } else if (taskStatus === 'FAILED' || taskStatus === 'failed') {
      throw new Error(`任务失败: ${getText(result.message) || getText(dataRecord.message) || '未知错误'}`)
    }
  }

  throw new Error('任务超时')
}

export async function generateComicImage(prompt: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  // 使用Seedream 4.5 API
  try {
    return await generateWithSeedream45(prompt, options)
  } catch (seedreamError) {
    console.warn('Seedream 4.5 API调用失败，尝试使用旧版本API:', seedreamError)
    try {
      return await generateWithLegacyVolcengine(prompt, options)
    } catch (legacyError) {
      console.error('旧版本API也调用失败:', legacyError)
      throw new Error(`图片生成失败。Seedream 4.5 API错误: ${seedreamError instanceof Error ? seedreamError.message : String(seedreamError)}；旧版本API错误: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`)
    }
  }
}

export async function parseStoryToScenes(story: string): Promise<Array<{ frame: number, description: string, prompt: string }>> {
  const scenes = story.split('\n\n').filter(s => s.trim())
  
  return scenes.map((scene, index) => ({
    frame: index + 1,
    description: scene,
    prompt: `漫画风格，${scene}`
  }))
}

export async function generateComicFromStory(story: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  const scenes = await parseStoryToScenes(story)
  const images: ComicImage[] = []
  
  for (const scene of scenes) {
    try {
      const result = await generateComicImage(scene.prompt, {
        ...options,
        frames: 1
      })
      images.push(...result.images)
    } catch (error) {
      console.error(`生成第${scene.frame}帧失败:`, error)
      throw error
    }
  }
  
  return {
    success: true,
    images
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function firstText(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  return value.find((item): item is string => typeof item === 'string')
}

function firstImageUrl(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  for (const item of value) {
    if (isRecord(item) && typeof item.url === 'string') {
      return item.url
    }
  }
  return undefined
}

function firstBase64(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined
  for (const item of value) {
    if (isRecord(item) && typeof item.image_base64 === 'string') {
      return item.image_base64
    }
  }
  return undefined
}
