type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type StreamCallback = (chunk: string) => void

/**
 * 流式生成歌词 - DeepSeek
 */
export async function generateLyricsWithDeepSeekStream(
  theme: string,
  onChunk: StreamCallback
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('缺少 DeepSeek API Key')
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_LYRICS_MODEL?.trim() || 'deepseek-chat'

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content:
        '你是专业中文歌词创作 agent。请输出适合音乐生成模型使用的结构化歌词，只输出歌词正文，不要解释。',
    },
    {
      role: 'user',
      content: [
        `主题：${theme}`,
        '要求：',
        '1. 使用中文歌词。',
      ].join('\n'),
    },
  ]

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 1,
      messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek 接口调用失败：${response.status} ${errorText}`)
  }

  let fullContent = ''
  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              onChunk(content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}

/**
 * 流式生成音乐 - MiniMax
 */
export async function generateMusicWithMiniMaxStream(
  prompt: string,
  lyrics: string,
  isInstrumental: boolean,
  onChunk: StreamCallback
): Promise<{
  audioUrl?: string
  traceId?: string
  model: string
  extraInfo?: Record<string, unknown>
  warnings: string[]
}> {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('缺少 MiniMax API Key')
  }

  const model = process.env.MINIMAX_MUSIC_MODEL?.trim() || 'music-2.6'

  onChunk('正在调用 MiniMax 音乐生成接口...\n')

  const response = await fetch('https://api.minimaxi.com/v1/music_generation', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      lyrics: isInstrumental ? undefined : lyrics,
      stream: false,
      output_format: 'url',
      is_instrumental: isInstrumental,
      lyrics_optimizer: false,
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MiniMax 音乐生成失败：${response.status} ${errorText}`)
  }

  const data = (await response.json()) as unknown
  const record = asRecord(data)
  const baseResp = asRecord(record.base_resp)
  const statusCode = typeof baseResp.status_code === 'number' ? baseResp.status_code : 0

  if (statusCode !== 0) {
    throw new Error(`MiniMax 返回错误：${asString(baseResp.status_msg) || '未知错误'}`)
  }

  onChunk('音乐生成完成！\n')

  const warnings: string[] = []
  const audioUrl = findAudioUrl(data)
  let resolvedAudioUrl = audioUrl

  if (!resolvedAudioUrl) {
    const hexAudio = findHexAudio(data)
    if (hexAudio) {
      resolvedAudioUrl = hexToDataUrl(hexAudio)
      warnings.push('MiniMax 返回了 hex 音频，接口已转换为可预览的 data URL。')
    }
  }

  return {
    audioUrl: resolvedAudioUrl,
    traceId: asString(record.trace_id),
    extraInfo: asRecord(record.extra_info),
    model,
    warnings,
  }
}

function findAudioUrl(data: unknown): string | undefined {
  const visited = new Set<unknown>()
  const queue: unknown[] = [data]

  while (queue.length) {
    const current = queue.shift()
    if (!current || typeof current !== 'object' || visited.has(current)) continue
    visited.add(current)

    for (const value of Object.values(current as Record<string, unknown>)) {
      if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        return value
      }

      if (value && typeof value === 'object') {
        queue.push(value)
      }
    }
  }

  return undefined
}

function findHexAudio(data: unknown): string | undefined {
  const root = asRecord(data)
  const payload = asRecord(root.data)
  const audio = asString(payload.audio)

  if (!audio) {
    return undefined
  }

  return /^[0-9a-fA-F]+$/.test(audio) ? audio : undefined
}

function hexToDataUrl(hex: string) {
  const base64 = Buffer.from(hex, 'hex').toString('base64')
  return `data:audio/mpeg;base64,${base64}`
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
