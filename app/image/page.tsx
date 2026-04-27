'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  ChevronRight,
  Image as ImageIcon,
  Palette,
  Loader2,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { FileUploader } from '@/components/comments/file-uploader'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'

type ImageGenerationResult = {
  request_id: string
  images: Array<{ url: string; base64?: string }>
}

const aspectOptions = [
  { label: '1:1', width: 1024, height: 1024 },
  { label: '4:5', width: 1024, height: 1280 },
  { label: '16:9', width: 1280, height: 720 },
]

export default function ImageServicePage() {
  const [showCompactNav, setShowCompactNav] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [numImages, setNumImages] = useState(1)
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImageGenerationResult | null>(null)

  useEffect(() => {
    const onScroll = () => setShowCompactNav(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width,
          height,
          num_images: numImages,
          provider: 'grsai',
          imageUrls: referenceImageUrls,
        }),
      })

      const data = (await response.json()) as {
        message?: string
        result?: ImageGenerationResult
      }

      if (!response.ok || !data.result) {
        throw new Error(data.message || '图片生成失败')
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,#fff8f0_0%,#f7fbff_44%,#eefbf5_100%)] text-slate-800">
      {!showCompactNav && <Navbar />}

      <div className="mx-auto max-w-7xl px-3 pb-12 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/70 bg-white/55 px-4 py-6 shadow-[0_24px_80px_rgba(26,65,111,0.08)] backdrop-blur-xl sm:px-10 sm:py-8">
          <div className="pointer-events-none absolute -top-20 right-8 h-48 w-48 rounded-full bg-gradient-to-b from-amber-200/50 to-transparent blur-2xl sm:h-56 sm:w-56" />
          <div className="pointer-events-none absolute bottom-8 right-16 hidden text-[140px] text-amber-200/35 md:block">
            ✦
          </div>
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
          <div className="relative">
            <p className="text-[10px] font-medium uppercase tracking-[0.34em] text-slate-400">图片工作台</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
              图片服务
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-lg">生成、编辑、预览</p>
          </div>
        </section>

        <Surface className="mb-5 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">工作流程</h2>
            <div className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
              <Sparkles className="h-4 w-4 text-amber-400" />
              参考图可直接进入编辑
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {[
              { title: '提示词', subtitle: '描述你要的画面', icon: Palette, accent: 'from-amber-50 to-orange-100/40 text-amber-600 border-amber-100', badge: 'bg-amber-500' },
              { title: '参考图', subtitle: '上传原始素材', icon: ImageIcon, accent: 'from-cyan-50 to-cyan-100/40 text-cyan-600 border-cyan-100', badge: 'bg-cyan-500' },
              { title: '生成', subtitle: '提交到 GrsAI', icon: WandSparkles, accent: 'from-emerald-50 to-emerald-100/40 text-emerald-600 border-emerald-100', badge: 'bg-emerald-500' },
              { title: '结果', subtitle: '查看并下载图片', icon: Sparkles, accent: 'from-violet-50 to-violet-100/40 text-violet-600 border-violet-100', badge: 'bg-violet-500' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="contents">
                  <div className={`rounded-3xl border bg-gradient-to-r px-4 py-4 ${item.accent}`}>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${item.badge}`}>
                        {`0${index + 1}`}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 sm:text-base">{item.title}</p>
                        <p className="truncate text-xs text-slate-500 sm:text-sm">{item.subtitle}</p>
                      </div>
                      <Icon className="ml-auto h-5 w-5 shrink-0 opacity-80 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="hidden items-center justify-center lg:flex">
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Surface>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <Surface className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">输入区</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">生成配置</h2>
              </div>
              <StatusPill>{referenceImageUrls.length > 0 ? '图生图' : '文生图'}</StatusPill>
            </div>

            <div className="mt-6 space-y-5">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-cyan-300 focus:bg-white"
                placeholder="输入提示词"
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="尺寸">
                  <ControlShell>
                    <select
                      value={`${width}x${height}`}
                      onChange={(e) => {
                        const option = aspectOptions.find((item) => `${item.width}x${item.height}` === e.target.value)
                        if (option) {
                          setWidth(option.width)
                          setHeight(option.height)
                        }
                      }}
                      className="h-full w-full appearance-none bg-transparent text-sm text-slate-700 outline-none"
                    >
                      {aspectOptions.map((item) => (
                        <option key={item.label} value={`${item.width}x${item.height}`}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </ControlShell>
                </Field>

                <Field label="数量">
                  <ControlShell>
                    <select
                      value={numImages}
                      onChange={(e) => setNumImages(Number(e.target.value))}
                      className="h-full w-full appearance-none bg-transparent text-sm text-slate-700 outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </ControlShell>
                </Field>

                <Field label="模式">
                  <ControlShell dashed>
                    {isGenerating ? '进行中' : '待命'}
                  </ControlShell>
                </Field>
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-slate-400">参考图</p>
                <FileUploader
                  accept="image/*"
                  multiple={false}
                  value={referenceImageUrls}
                  onChange={setReferenceImageUrls}
                  buttonLabel={referenceImageUrls.length > 0 ? '更换' : '上传'}
                  previewMode="image"
                  maxFiles={1}
                  maxSize={20 * 1024 * 1024}
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={generateImage}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {isGenerating ? '生成中' : '生成'}
              </button>
            </div>
          </Surface>

          <Surface className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">输出区</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">生成结果</h2>
              </div>
              {result ? (
                <StatusPill>已完成</StatusPill>
              ) : (
                <StatusPill>空闲</StatusPill>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-3 sm:p-5">
              {result ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ResultStat label="任务ID" value={result.request_id} />
                    <ResultStat label="数量" value={`${result.images.length}`} />
                    <ResultStat label="比例" value={`${width}:${height}`} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.images.map((item, index) => {
                      const src = item.url || (item.base64 ? `data:image/png;base64,${item.base64}` : '')
                      return (
                        <article
                          key={`${result.request_id}-${index}`}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                        >
                          <div className="aspect-square bg-slate-100">
                            {src ? (
                              <img
                                src={src}
                                alt={`result ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                                Empty
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-medium text-slate-900">{index + 1}</p>
                            <p className="mt-1 break-all text-xs leading-5 text-slate-500">{item.url || 'base64'}</p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 text-center sm:min-h-[360px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 sm:h-16 sm:w-16">
                    <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-900 sm:text-lg">暂无结果</h3>
                </div>
              )}
            </div>
          </Surface>
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-slate-400">
        {label}
      </label>
      {children}
    </div>
  )
}

function ControlShell({ children, dashed = false }: { children: ReactNode; dashed?: boolean }) {
  return (
    <div
      className={[
        'flex h-12 items-center rounded-2xl border px-4 transition',
        dashed
          ? 'border-dashed border-slate-200 bg-white text-slate-500'
          : 'border-slate-200 bg-slate-50/80 text-slate-700 focus-within:border-cyan-300 focus-within:bg-white',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm">
      {children}
    </span>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  )
}
