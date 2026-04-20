import { Signer } from '@volcengine/openapi'

export interface ComicOptions {
  model?: string
  style?: string
  ratio?: string
  frames?: number
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

async function generateWithVolcengine(prompt: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
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
      model: options.model || 'jimeng-4-0',
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
                (/\.(png|jpg|jpeg|webp|gif|bmp)/i.test(value) || value.includes('volcengine'))
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
  return generateWithVolcengine(prompt, options)
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
