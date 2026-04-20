'use client'

import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle2, Circle, AlertCircle, Play, RefreshCw, ChevronRight } from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { Navbar } from '@/components/navbar'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

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
  images: Array<{
    url: string
    base64?: string
  }>
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

export default function MusicPage() {
  const [showCompactNav, setShowCompactNav] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'lyrics', name: '生成歌词', status: 'idle', data: {} },
    { id: 'image', name: '生成缩略图', status: 'idle', data: {} },
    { id: 'music', name: '生成歌曲', status: 'idle', data: {} },
    { id: 'publish', name: '发布', status: 'idle', data: {} },
  ])
  const [theme, setTheme] = useState('一个人在城市夜里走路，想把孤独唱成温柔')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setShowCompactNav(window.scrollY > 100)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // 更新步骤状态
  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    )
  }

  // 步骤1：生成歌词
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
            if (line.startsWith('data: ')) {
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

  // 步骤2：生成缩略图
  const generateImage = async () => {
    const lyricsStep = steps.find((s) => s.id === 'lyrics')
    if (!lyricsStep?.data?.title) {
      setError('请先生成歌词')
      return
    }

    updateStep('image', { status: 'running', error: undefined })
    setError(null)

    try {
      const imagePrompt = `${lyricsStep.data.title}，${theme}`
      console.log('生成图片请求:', { prompt: imagePrompt })
      
      // 先测试 API 是否可访问
      try {
        const testResponse = await fetch('/api/image/generate', {
          method: 'GET',
        })
        console.log('API 测试响应:', await testResponse.json())
      } catch (testError) {
        console.error('API 测试失败:', testError)
        throw new Error('无法连接到图片生成服务，请确保开发服务器正在运行')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          width: 768,
          height: 768,
          num_images: 1,
        }),
        signal: controller.signal,
      }).catch((fetchError) => {
        clearTimeout(timeoutId)
        console.error('Fetch error:', fetchError)
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请重试')
        }
        throw new Error(`网络请求失败: ${fetchError.message}`)
      })

      clearTimeout(timeoutId)
      console.log('图片生成响应状态:', response.status)

      const imageData = (await response.json()) as {
        message?: string
        result?: GenerateImageResult
      }

      console.log('图片生成响应数据:', imageData)

      if (!response.ok || !imageData.result) {
        throw new Error(imageData.message || `生图失败 (状态码: ${response.status})`)
      }

      const imageUrl = imageData.result.images[0]?.url || 
        (imageData.result.images[0]?.base64
          ? `data:image/png;base64,${imageData.result.images[0].base64}`
          : undefined)

      if (!imageUrl) {
        throw new Error('未获取到图片URL')
      }

      console.log('图片生成成功:', imageUrl.substring(0, 100))

      updateStep('image', {
        status: 'pending_review',
        data: {
          imageUrl,
          imageRequestId: imageData.result.request_id,
        },
      })
    } catch (err) {
      console.error('生成图片错误:', err)
      const errorMsg = err instanceof Error ? err.message : '生图失败'
      updateStep('image', { status: 'error', error: errorMsg })
      setError(`生成缩略图失败: ${errorMsg}`)
    }
  }

  // 步骤3：生成歌曲
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
            if (line.startsWith('data: ')) {
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

  // 步骤4：发布
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
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      const musicResult = musicStep.data.musicResult

      const response = await fetch('/api/music/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: lyricsStep?.data?.title || musicResult.title,
          summary: lyricsStep?.data?.prompt || musicResult.prompt,
          mediaAudio: musicStep.data.audioUrl,
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

  // 确认步骤
  const approveStep = (stepId: string) => {
    updateStep(stepId, { status: 'completed' })
    const stepIndex = steps.findIndex((s) => s.id === stepId)
    if (stepIndex < steps.length - 1) {
      setCurrentStepIndex(stepIndex + 1)
    }
  }

  // 重新生成步骤
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.2),transparent_26%),radial-gradient(circle_at_bottom_center,rgba(251,191,36,0.12),transparent_24%)]" />
      <div className="pointer-events-none absolute left-10 top-24 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

      {!showCompactNav ? <Navbar /> : null}

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge tone="violet">music studio</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            音乐工作台 - 分步骤模式
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            每个步骤独立生成，审核满意后再进行下一步
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Left: Form & Steps */}
          <div className="space-y-6">
            {/* Theme Input */}
            <Surface className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold text-slate-900">创作主题</h2>
              <div className="mt-6">
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-200"
                  placeholder="描述你想要的歌曲主题和故事"
                />
              </div>
            </Surface>

            {/* Steps Panel */}
            <Surface className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold text-slate-900">执行步骤</h2>
              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`rounded-xl border-2 p-4 transition ${
                      step.status === 'completed'
                        ? 'border-emerald-200 bg-emerald-50'
                        : step.status === 'pending_review'
                        ? 'border-amber-200 bg-amber-50'
                        : step.status === 'running'
                        ? 'border-cyan-200 bg-cyan-50'
                        : step.status === 'error'
                        ? 'border-rose-200 bg-rose-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {step.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        )}
                        {step.status === 'running' && (
                          <Circle className="h-5 w-5 animate-spin text-cyan-500" />
                        )}
                        {step.status === 'pending_review' && (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        {step.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-rose-500" />
                        )}
                        {step.status === 'idle' && (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {index + 1}. {step.name}
                          </p>
                          {step.status === 'idle' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (step.id === 'lyrics') generateLyrics()
                                else if (step.id === 'image') generateImage()
                                else if (step.id === 'music') generateMusic()
                                else if (step.id === 'publish') publishContent()
                              }}
                              disabled={
                                (step.id === 'image' &&
                                  steps.find((s) => s.id === 'lyrics')?.status !== 'completed') ||
                                (step.id === 'music' &&
                                  steps.find((s) => s.id === 'lyrics')?.status !== 'completed') ||
                                (step.id === 'publish' &&
                                  steps.find((s) => s.id === 'music')?.status !== 'completed')
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Play className="h-3 w-3" />
                              开始
                            </button>
                          )}
                          {step.status === 'pending_review' && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => regenerateStep(step.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-400"
                              >
                                <RefreshCw className="h-3 w-3" />
                                重新生成
                              </button>
                              <button
                                type="button"
                                onClick={() => approveStep(step.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-400"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                确认
                              </button>
                            </div>
                          )}
                          {step.status === 'running' && (
                            <span className="text-xs text-slate-500">生成中...</span>
                          )}
                          {step.status === 'completed' && (
                            <span className="text-xs text-emerald-600">已完成</span>
                          )}
                        </div>
                        {step.error && (
                          <p className="mt-1 text-xs text-rose-600">{step.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </Surface>
          </div>

          {/* Right: Preview */}
          <Surface className="p-6 sm:p-7">
            <h2 className="text-xl font-semibold text-slate-900">预览</h2>

            <div className="mt-6 space-y-6">
              {/* Step 1: Lyrics Preview */}
              {steps[0].data?.lyrics && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                      歌词
                    </p>
                    {steps[0].status === 'pending_review' && (
                      <Badge tone="orange">待审核</Badge>
                    )}
                  </div>
                  {steps[0].data.title && (
                    <p className="mb-2 text-lg font-semibold text-slate-900">
                      {steps[0].data.title}
                    </p>
                  )}
                  {steps[0].data.prompt && (
                    <p className="mb-3 text-sm text-slate-600">{steps[0].data.prompt}</p>
                  )}
                  <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {steps[0].data.lyrics}
                  </pre>
                </div>
              )}

              {/* Step 2: Image Preview */}
              {steps[1].data?.imageUrl && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                      缩略图
                    </p>
                    {steps[1].status === 'pending_review' && (
                      <Badge tone="orange">待审核</Badge>
                    )}
                  </div>
                  <img
                    src={steps[1].data.imageUrl}
                    alt="Generated cover"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Step 3: Music Preview */}
              {steps[2].data?.audioUrl && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                      音频
                    </p>
                    {steps[2].status === 'pending_review' && (
                      <Badge tone="orange">待审核</Badge>
                    )}
                  </div>
                  <audio className="w-full" controls src={steps[2].data.audioUrl}>
                    你的浏览器暂不支持音频播放。
                  </audio>
                  {steps[2].data.musicResult && (
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {steps[2].data.musicResult.extraInfo?.music_duration && (
                        <div>
                          时长：
                          {formatDuration(steps[2].data.musicResult.extraInfo.music_duration)}
                        </div>
                      )}
                      {steps[2].data.musicResult.model && (
                        <div>
                          <Badge tone="emerald">{steps[2].data.musicResult.model}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!steps[0].data?.lyrics &&
                !steps[1].data?.imageUrl &&
                !steps[2].data?.audioUrl && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                    <p>开始生成后，结果会在这里显示</p>
                    <p className="mt-1 text-xs text-slate-500">每个步骤都可以独立审核和重新生成</p>
                  </div>
                )}
            </div>
          </Surface>
        </div>
      </div>
    </main>
  )
}

function formatDuration(duration?: number) {
  if (!duration || duration <= 0) return '--'

  const totalSeconds = Math.floor(duration / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
