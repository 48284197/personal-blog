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

  let lyrics = ''
  let generatedTitle = input.title.trim()

  if (!isInstrumental) {
    if (input.lyricsMode === 'manual') {
      lyrics = normalizeLyrics(input.manualLyrics ?? '')
    } else {
      const result = await generateLyricsWithDeepSeek(input, prompt)
      lyrics = result.lyrics
      generatedTitle = result.title
    }
  }

  if (!isInstrumental && !lyrics.trim()) {
    throw new Error('当前为有人声模式，但没有可用歌词。请补充手动歌词或配置 DeepSeek。')
  }

  const miniMaxResponse = await generateMusicWithMiniMax({
    prompt,
    lyrics,
    isInstrumental,
  })

  return {
    title: generatedTitle,
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

async function generateLyricsWithDeepSeek(input: MusicWorkflowInput, prompt: string): Promise<{ title: string; lyrics: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('缺少 DeepSeek API Key，请配置 `DEEPSEEK_API_KEY`。')
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_LYRICS_MODEL?.trim() || 'deepseek-chat'

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: `你是一位资深中文歌词创作人，擅长为不同曲风创作有韵律、有情感、有画面感的歌词。

【创作原则】
1. 韵律感：注意押韵和节奏，让歌词朗朗上口
2. 情感真挚：避免空洞的辞藻堆砌，表达真实情感
3. 画面感：用具体的意象和场景，让听众能"看到"歌词
4. 结构完整：主歌铺垫情绪，副歌爆发高潮，桥段转折升华

【输出格式】
必须按以下格式输出：

【标题】
歌曲标题（4-8个字，有诗意，符合主题）

【歌词】
[Verse 1] - 主歌第一段，建立故事背景
[Verse 2] - 主歌第二段，推进情感发展  
[Chorus] - 副歌，核心情感表达，记忆点
[Bridge] - 桥段（可选），情绪转折
[Outro] - 尾声（可选），余韵收束

只输出标题和歌词，不要解释。`,
    },
    {
      role: 'user',
      content: `请为以下音乐创作一首高质量中文歌词：

【歌曲信息】
主题：${input.theme}
曲风：${input.genre}
情绪：${input.mood}
场景：${input.scene}

【创作要求】
${input.extraPrompt?.trim() || '1. 歌词要有故事性和情感层次\n2. 避免陈词滥调，追求新颖表达\n3. 每段4-6行，总长度适中'}

【参考风格】
${prompt}

请按格式输出标题和歌词：`,
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

  // 解析标题和歌词
  const parsed = parseLyricsWithTitle(content)
  return parsed
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

/**
 * 解析包含标题和歌词的文本
 * 格式：【标题】xxx 【歌词】xxx
 */
function parseLyricsWithTitle(content: string): { title: string; lyrics: string } {
  // 尝试匹配【标题】格式
  const titleMatch = content.match(/【标题】\s*\n?([^\n【]+)/)
  const lyricsMatch = content.match(/【歌词】\s*\n?([\s\S]+)/)

  if (titleMatch && lyricsMatch) {
    return {
      title: titleMatch[1].trim(),
      lyrics: lyricsMatch[1].trim(),
    }
  }

  // 尝试匹配 "标题：" 或 "Title:" 格式
  const altTitleMatch = content.match(/(?:标题|Title)[:：]\s*\n?([^\n]+)/i)
  if (altTitleMatch) {
    // 移除标题行，剩余为歌词
    const lines = content.split('\n')
    const titleLineIndex = lines.findIndex(line => /(?:标题|Title)[:：]/i.test(line))
    const lyrics = lines
      .slice(titleLineIndex + 1)
      .join('\n')
      .trim()
    return {
      title: altTitleMatch[1].trim(),
      lyrics: lyrics || content,
    }
  }

  // 如果都没有匹配到，尝试第一行作为标题
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length > 1 && lines[0].length < 20) {
    return {
      title: lines[0].trim(),
      lyrics: lines.slice(1).join('\n').trim(),
    }
  }

  // 默认返回
  return {
    title: '未命名歌曲',
    lyrics: content,
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
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
