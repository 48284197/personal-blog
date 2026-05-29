'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  AudioLines,
  Music2,
  Send,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ChevronRight,
  History,
  Play,
} from 'lucide-react'
import { Surface } from '@/components/landing'
import { Navbar } from '@/components/navbar'

/* ====== 类型保持不变 ====== */
type GenerateMusicResult = {
  title: string
  prompt: string
  lyrics: string
  audioUrl?: string
  traceId?: string
  model: string
  warnings: string[]
  extraInfo?: {
    music_duration?: number
    music_sample_rate?: number
    music_channel?: number
    bitrate?: number
    music_size?: number
  }
}

type GenerateImageResult = {
  request_id: string
  images: Array<{ url: string; base64?: string }>
}

type StepStatus = 'idle' | 'running' | 'completed' | 'error' | 'pending_review'

type StepData = {
  lyrics?: string
  title?: string
  prompt?: string
  imageUrl?: string
  imageRequestId?: string
  audioUrl?: string
  musicResult?: GenerateMusicResult
}

type WorkflowStep = {
  id: string
  name: string
  status: StepStatus
  error?: string
  data?: StepData
}

const stepUi = [
  {
    id: 'lyrics',
    title: '生成歌词',
    subtitle: 'AI 帮你生成灵感歌词',
    icon: FileText,
    accent: 'from-blue-50 to-blue-100/40 text-blue-600 border-blue-100',
    badge: 'bg-blue-500',
  },
  {
    id: 'image',
    title: '生成封面图',
    subtitle: '生成旋律和编曲结构',
    icon: AudioLines,
    accent: 'from-emerald-50 to-emerald-100/40 text-emerald-600 border-emerald-100',
    badge: 'bg-emerald-500',
  },
  {
    id: 'music',
    title: '生成歌曲',
    subtitle: '合成完整歌曲',
    icon: Music2,
    accent: 'from-violet-50 to-violet-100/40 text-violet-600 border-violet-100',
    badge: 'bg-violet-500',
  },
  {
    id: 'publish',
    title: '发布',
    subtitle: '发布到社区分享交流',
    icon: Send,
    accent: 'from-orange-50 to-orange-100/40 text-orange-600 border-orange-100',
    badge: 'bg-orange-500',
  },
] as const

const suggestions = ['夜晚', '孤独', '温柔', '城市', '回忆']

export default function MusicPage() {
  const [showCompactNav, setShowCompactNav] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'lyrics', name: '生成歌词', status: 'idle', data: {} },
    { id: 'image', name: '生成缩略图', status: 'idle', data: {} },
    { id: 'music', name: '生成歌曲', status: 'idle', data: {} },
    { id: 'publish', name: '发布', status: 'idle', data: {} },
  ])

  const [theme, setTheme] = useState(
    '一个人在城市夜里走路，想把孤独唱成温柔'
  )

  useEffect(() => {
    const onScroll = () => {
      setShowCompactNav(window.scrollY > 100)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    )
  }

  const generateLyrics = async () => {
    updateStep('lyrics', { status: 'running', error: undefined })
    setError(null)

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, lyricsOnly: true }),
      })

      if (!response.ok) {
        throw new Error('生成歌词失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedLyrics = ''
      let title = ''
      let prompt = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              const { event: eventType, data: eventData } = data

              if (eventType === 'lyrics_chunk') {
                accumulatedLyrics += eventData.chunk
                updateStep('lyrics', {
                  data: { lyrics: accumulatedLyrics, title, prompt },
                })
              } else if (eventType === 'step' && eventData.step === 'lyrics') {
                if (eventData.status === 'completed' && eventData.data) {
                  title = eventData.data.title || ''
                  prompt = eventData.data.prompt || ''
                  accumulatedLyrics = eventData.data.lyrics || accumulatedLyrics
                  updateStep('lyrics', {
                    status: 'pending_review',
                    data: { lyrics: accumulatedLyrics, title, prompt },
                  })
                }
              }
            } catch (e) {
              console.error('Failed to parse stream event:', e)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成歌词失败'
      updateStep('lyrics', { status: 'error', error: errorMsg })
      setError(errorMsg)
    }
  }

  const generateImage = async () => {
    const lyricsStep = steps.find((s) => s.id === 'lyrics')
    if (!lyricsStep?.data?.title) {
      setError('请先生成歌词')
      return
    }

    updateStep('image', { status: 'running', error: undefined })
    setError(null)

    try {
      const lyrics = lyricsStep.data.lyrics || ''
      const title = lyricsStep.data.title

      const promptResponse = await fetch('/api/image/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          theme,
          lyrics,
        }),
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json()
        throw new Error(errorData.message || '生成图片提示词失败')
      }

      const promptData = (await promptResponse.json()) as {
        prompt: string
        originalPrompt: string
      }
      const imagePrompt = promptData.prompt

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          width: 1024,
          height: 1024,
          num_images: 1,
        }),
        signal: controller.signal,
      }).catch((fetchError) => {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请重试')
        }
        throw new Error(`网络请求失败: ${fetchError.message}`)
      })

      clearTimeout(timeoutId)
      const imageData = (await response.json()) as {
        message?: string
        result?: GenerateImageResult
      }

      if (!response.ok || !imageData.result) {
        throw new Error(imageData.message || `生图失败 (状态码: ${response.status})`)
      }

      const imageUrl =
        imageData.result.images[0]?.url ||
        (imageData.result.images[0]?.base64
          ? `data:image/png;base64,${imageData.result.images[0].base64}`
          : undefined)

      if (!imageUrl) {
        throw new Error('未获取到图片URL')
      }

      updateStep('image', {
        status: 'pending_review',
        data: {
          imageUrl,
          imageRequestId: imageData.result.request_id,
        },
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生图失败'
      updateStep('image', { status: 'error', error: errorMsg })
      setError(`生成缩略图失败: ${errorMsg}`)
    }
  }

  const generateMusic = async () => {
    const lyricsStep = steps.find((s) => s.id === 'lyrics')
    if (!lyricsStep?.data?.lyrics) {
      setError('请先生成歌词')
      return
    }

    updateStep('music', { status: 'running', error: undefined })
    setError(null)

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          lyrics: lyricsStep.data.lyrics,
          title: lyricsStep.data.title,
          musicOnly: true,
        }),
      })

      if (!response.ok) {
        throw new Error('生成音乐失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      let musicResult: GenerateMusicResult | undefined

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              const { event: eventType, data: eventData } = data

              if (eventType === 'step' && eventData.step === 'music') {
                if (eventData.status === 'completed' && eventData.data) {
                  musicResult = eventData.data
                  updateStep('music', {
                    status: 'pending_review',
                    data: { musicResult, audioUrl: eventData.data.audioUrl },
                  })
                }
              } else if (eventType === 'complete' && eventData.result) {
                musicResult = eventData.result
                updateStep('music', {
                  status: 'pending_review',
                  data: { musicResult, audioUrl: eventData.result.audioUrl },
                })
              }
            } catch (e) {
              console.error('Failed to parse stream event:', e)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成音乐失败'
      updateStep('music', { status: 'error', error: errorMsg })
      setError(errorMsg)
    }
  }

  const publishContent = async () => {
    const lyricsStep = steps.find((s) => s.id === 'lyrics')
    const imageStep = steps.find((s) => s.id === 'image')
    const musicStep = steps.find((s) => s.id === 'music')

    if (!musicStep?.data?.musicResult) {
      setError('请先完成音乐生成')
      return
    }

    updateStep('publish', { status: 'running', error: undefined })
    setError(null)

    try {
      const musicResult = musicStep.data.musicResult
      const audioUrl = musicResult.audioUrl || musicStep.data.audioUrl

      if (!audioUrl) {
        throw new Error('音频 URL 不存在，请重新生成音乐')
      }

      const response = await fetch('/api/music/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lyricsStep?.data?.title || musicResult.title,
          summary: lyricsStep?.data?.prompt || musicResult.prompt,
          mediaAudio: audioUrl,
          coverUrl: imageStep?.data?.imageUrl,
          mediaDuration: musicResult.extraInfo?.music_duration
            ? formatDuration(musicResult.extraInfo.music_duration)
            : undefined,
          tags: ['音乐', '生成'],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '发布失败')
      }

      updateStep('publish', { status: 'completed' })
      alert('发布成功！已添加到内容区')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '发布失败'
      updateStep('publish', { status: 'error', error: errorMsg })
      setError(errorMsg)
    }
  }

  const approveStep = (stepId: string) => {
    updateStep(stepId, { status: 'completed' })
  }

  const regenerateStep = async (stepId: string) => {
    updateStep(stepId, { status: 'idle', error: undefined, data: {} })
    if (stepId === 'lyrics') {
      await generateLyrics()
    } else if (stepId === 'image') {
      await generateImage()
    } else if (stepId === 'music') {
      await generateMusic()
    }
  }

  const runStep = (id: string) => {
    if (id === 'lyrics') return generateLyrics()
    if (id === 'image') return generateImage()
    if (id === 'music') return generateMusic()
    return publishContent()
  }

  /* ====== UI ====== */
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#eef2ff_0%,#f4f7fb_42%,#ecfbf5_100%)] text-slate-800">
      {!showCompactNav && <Navbar />}

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6">
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/70 bg-white/55 px-6 py-8 shadow-[0_24px_80px_rgba(26,65,111,0.08)] backdrop-blur-xl sm:px-10">
          <div className="pointer-events-none absolute -top-20 right-8 h-56 w-56 rounded-full bg-gradient-to-b from-cyan-200/50 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute bottom-8 right-16 hidden text-[140px] text-sky-200/40 md:block">
            ♫
          </div>
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
          <div className="relative">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">音乐工作台</h1>
            <p className="mt-2 text-lg text-slate-500">从灵感到作品，让音乐创作更简单</p>
          </div>
        </section>

        <Surface className="mb-5 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">创作流程</h2>
            <div className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              按顺序完成创作，体验更佳
            </div>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {stepUi.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="contents">
                  <div className={`rounded-3xl border bg-gradient-to-r px-4 py-4 ${item.accent}`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${item.badge}`}>
                        {`0${index + 1}`}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-800">{item.title}</p>
                        <p className="truncate text-sm text-slate-500">{item.subtitle}</p>
                      </div>
                      <Icon className="ml-auto h-6 w-6 opacity-80" />
                    </div>
                  </div>
                  {index < stepUi.length - 1 && (
                    <div className="hidden items-center justify-center xl:flex">
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Surface>

        <div className="grid gap-5 xl:grid-cols-[37%_1fr]">
          <div className="space-y-5">
            <Surface className="p-5 sm:p-6">
              <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-900">创作主题</h3>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  maxLength={200}
                  className="h-28 w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <div className="text-right text-xs text-slate-400">{theme.length}/200</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">推荐主题</span>
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTheme((prev) => `${prev.replace(/\s+$/g, '')} ${tag}`.trim())}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {tag}
                  </button>
                ))}
                <button
                  onClick={() => setTheme('想做一首清晨海风感的轻电子，歌词要有希望和留白')}
                  className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  换一换
                </button>
              </div>
            </Surface>

            <Surface className="p-5 sm:p-6">
              <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-900">执行步骤</h3>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    {index < steps.length - 1 && (
                      <span className="absolute left-[17px] top-11 h-7 w-px bg-slate-200" />
                    )}
                    <div className="flex items-center gap-3">
                      <StepStatusDot status={step.status} index={index} />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-slate-900">{step.name}</p>
                        <p className="text-sm text-slate-500">{stepUi[index]?.subtitle}</p>
                        {step.error && <p className="mt-1 text-xs text-rose-500">{step.error}</p>}
                      </div>
                      <StepActionButton
                        step={step}
                        onRun={() => runStep(step.id)}
                        onApprove={() => approveStep(step.id)}
                        onRegenerate={() => regenerateStep(step.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          <Surface className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tight text-slate-900">预览</h3>
              <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                <History className="h-4 w-4" />
                创作记录
              </button>
            </div>

            <div className="min-h-[520px] rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-5">
              {!steps[0].data?.lyrics && !steps[1].data?.imageUrl && !steps[2].data?.audioUrl ? (
                <div className="flex h-[420px] flex-col items-center justify-center text-center text-slate-400">
                  <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-300">
                    <Music2 className="h-14 w-14" />
                  </div>
                  <p className="text-2xl font-bold text-slate-500">开始生成后，结果会在这里显示</p>
                  <p className="mt-2 text-base">每个步骤都可以独立审核和重新生成</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps[0].data?.lyrics && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-500">歌词</p>
                      <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{steps[0].data.lyrics}</pre>
                    </div>
                  )}
                  {steps[1].data?.imageUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-500">封面预览</p>
                      <Image src={steps[1].data.imageUrl} alt="封面预览" width={1024} height={1024} unoptimized className="h-auto w-full rounded-xl object-cover" />
                    </div>
                  )}
                  {steps[2].data?.audioUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-500">音频试听</p>
                      <audio controls src={steps[2].data.audioUrl} className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                主题越具体，生成效果越好
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-400" />
                可以先生成歌词再调整主题
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-cyan-500" />
                生成后可多次编辑直到满意
              </div>
            </div>
          </Surface>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {error}
        </div>
      )}
    </main>
  )
}

function StepStatusDot({ status, index }: { status: StepStatus; index: number }) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-6 w-6 text-emerald-500" />
  }
  if (status === 'running') {
    return <Circle className="h-6 w-6 animate-spin text-blue-500" />
  }
  if (status === 'pending_review') {
    return <AlertCircle className="h-6 w-6 text-amber-500" />
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
      {index + 1}
    </span>
  )
}

function StepActionButton({
  step,
  onRun,
  onApprove,
  onRegenerate,
}: {
  step: WorkflowStep
  onRun: () => void
  onApprove: () => void
  onRegenerate: () => void
}) {
  if (step.status === 'running') {
    return (
      <button
        disabled
        className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
      >
        进行中...
      </button>
    )
  }

  if (step.status === 'pending_review') {
    return (
      <button
        onClick={onApprove}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition hover:bg-emerald-600"
      >
        通过
      </button>
    )
  }

  if (step.status === 'completed') {
    return (
      <button
        onClick={onRegenerate}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        重做
      </button>
    )
  }

  return (
    <button
      onClick={onRun}
      className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
    >
      <Play className="h-3.5 w-3.5" />
      开始
    </button>
  )
}

function formatDuration(duration?: number) {
  if (!duration || duration <= 0) return '--'
  const totalSeconds = Math.floor(duration / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
