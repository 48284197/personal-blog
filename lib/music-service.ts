import {
  buildMusicPrompt,
  buildMusicWorkflow,
  type MusicWorkflowInput,
} from '@/lib/music-agents'

type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type MiniMaxExtraInfo = {
  music_duration?: number
  music_sample_rate?: number
  music_channel?: number
  bitrate?: number
  music_size?: number
}

export type MusicGenerationResult = {
  title: string
  prompt: string
  lyrics: string
  audioUrl?: string
  traceId?: string
  model: string
  extraInfo?: MiniMaxExtraInfo
  warnings: string[]
  workflow: ReturnType<typeof buildMusicWorkflow>
}

export async function generateMusicTrack(input: MusicWorkflowInput): Promise<MusicGenerationResult> {
  const prompt = buildMusicPrompt(input)
  const workflow = buildMusicWorkflow(input)
  const isInstrumental = input.vocalMode === 'instrumental'

  const lyrics = isInstrumental
    ? ''
    : input.lyricsMode === 'manual'
      ? normalizeLyrics(input.manualLyrics ?? '')
      : await generateLyricsWithDeepSeek(input, prompt)

  if (!isInstrumental && !lyrics.trim()) {
    throw new Error('当前为有人声模式，但没有可用歌词。请补充手动歌词或配置 DeepSeek。')
  }

  const miniMaxResponse = await generateMusicWithMiniMax({
    prompt,
    lyrics,
    isInstrumental,
  })

  return {
    title: input.title.trim(),
    prompt,
    lyrics,
    audioUrl: miniMaxResponse.audioUrl,
    traceId: miniMaxResponse.traceId,
    model: miniMaxResponse.model,
    extraInfo: miniMaxResponse.extraInfo,
    warnings: miniMaxResponse.warnings,
    workflow,
  }
}

async function generateLyricsWithDeepSeek(input: MusicWorkflowInput, prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('缺少 DeepSeek API Key，请配置 `DEEPSEEK_API_KEY`。')
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_LYRICS_MODEL?.trim() || 'deepseek-chat'

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content:
        '你是专业中文歌词创作 agent。请输出适合音乐生成模型使用的结构化歌词，必须包含如 [Verse]、[Chorus]、[Bridge] 等段落标签；只输出歌词正文，不要解释。',
    },
    {
      role: 'user',
      content: [
        `标题：${input.title}`,
        `主题：${input.theme}`,
        `曲风：${input.genre}`,
        `情绪：${input.mood}`,
        `场景：${input.scene}`,
        `补充要求：${input.extraPrompt?.trim() || '无'}`,
        `音乐提示词：${prompt}`,
        '要求：',
        '1. 使用中文歌词。',
        '2. 至少包含 [Verse] 和 [Chorus]。',
        '3. 保持画面感和可唱性。',
        '4. 控制在 16 行左右。',
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
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek 接口调用失败：${response.status} ${errorText}`)
  }

  const data: unknown = await response.json()
  const content = extractDeepSeekContent(data)

  if (!content) {
    throw new Error('DeepSeek 未返回可用歌词内容。')
  }

  return normalizeLyrics(content)
}

async function generateMusicWithMiniMax({
  prompt,
  lyrics,
  isInstrumental,
}: {
  prompt: string
  lyrics: string
  isInstrumental: boolean
}) {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('缺少 MiniMax API Key，请配置 `MINIMAX_API_KEY`。')
  }

  const model = process.env.MINIMAX_MUSIC_MODEL?.trim() || 'music-2.6'
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

  const data: unknown = await response.json()
  const record = asRecord(data)
  const baseResp = asRecord(record.base_resp)
  const statusCode = typeof baseResp.status_code === 'number' ? baseResp.status_code : 0

  if (statusCode !== 0) {
    throw new Error(`MiniMax 返回错误：${asString(baseResp.status_msg) || '未知错误'}`)
  }

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
    extraInfo: asRecord(record.extra_info) as MiniMaxExtraInfo | undefined,
    model,
    warnings,
  }
}

function extractDeepSeekContent(data: unknown) {
  const root = asRecord(data)
  const choices = Array.isArray(root.choices) ? root.choices : []

  for (const choice of choices) {
    const message = asRecord(asRecord(choice).message)
    const content = asString(message.content)
    if (content) {
      return content
    }
  }

  return undefined
}

function normalizeLyrics(value: string) {
  return value
    .replace(/```[\w-]*\n?/g, '')
    .replace(/```/g, '')
    .trim()
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
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
