'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Plus, WandSparkles } from 'lucide-react'
import { getErrorMessage, getResponseErrorMessage } from '@/lib/response-error'

type ImageGenerationResult = {
  request_id: string
  images: Array<{ url: string; base64?: string }>
}

const aspectOptions = [
  { label: '自动', width: 0, height: 0 },
  { label: '1K 正方形', width: 1024, height: 1024 },
  { label: '2K 横屏', width: 1536, height: 1024 },
  { label: '2K 竖屏', width: 1024, height: 1536 },
  { label: '2K 正方形', width: 2048, height: 2048 },
  { label: '4K 横屏', width: 3840, height: 2160 },
  { label: '4K 竖屏', width: 2160, height: 3840 },
]

export default function ImageServicePage() {
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [numImages, setNumImages] = useState(1)
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [isUploadingReference, setIsUploadingReference] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImageGenerationResult | null>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)

  const handleReferenceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploadingReference(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('files', file)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, '上传失败'))
      }

      const data = (await response.json()) as { files?: Array<{ url: string }> }
      const url = data.files?.[0]?.url
      if (!url) throw new Error('上传成功但未返回图片地址')
      setReferenceImageUrls([url])
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, '上传失败'))
    } finally {
      setIsUploadingReference(false)
    }
  }

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
          provider: 'tokenlab',
          quality: 'high',
          output_format: 'png',
          imageUrls: referenceImageUrls,
        }),
      })

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, '图片生成失败'))
      }

      const data = (await response.json()) as {
        result?: ImageGenerationResult
      }

      if (!data.result) throw new Error('图片生成失败：接口未返回图片结果')

      setResult(data.result)
    } catch (err) {
      setError(getErrorMessage(err, '图片生成失败'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f4f2] px-3 py-4 text-[#2e1a14] sm:px-5">
      <div className="mx-auto grid h-[calc(100vh-32px)] max-w-6xl grid-rows-[auto_1fr] overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d69200]">AI 生成图片</p>
            <h1 className="mt-1 text-[18px] font-bold">图片服务</h1>
          </div>
          <span className="rounded-full bg-[#fff0c6] px-3 py-1 text-[12px] font-bold text-[#d69200]">
            {referenceImageUrls.length > 0 ? '图生图' : '文生图'}
          </span>
        </div>

        <div className="grid min-h-0 gap-0 lg:grid-cols-[420px_1fr]">
          <section className="flex min-h-0 flex-col border-b border-slate-100 lg:border-b-0 lg:border-r">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想生成的画面..."
                  className="h-[132px] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 p-4 pr-14 text-[15px] leading-relaxed text-[#2e1a14] outline-none transition placeholder:text-slate-400 focus:border-[#f5c233] focus:bg-white"
                />
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReferenceUpload}
                />
                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={isUploadingReference}
                  className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f5c233] text-[#2e1a14] shadow-[0_8px_18px_rgba(245,194,51,0.25)] transition hover:bg-[#efba18] disabled:opacity-60"
                  aria-label="上传参考图"
                >
                  {isUploadingReference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>

              {referenceImageUrls.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {referenceImageUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPreviewImage(url)}
                      className="group relative aspect-square overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50"
                    >
                      <Image src={url} alt={`参考图 ${index + 1}`} fill sizes="20px" unoptimized className="object-cover transition duration-200 group-hover:scale-[1.03]" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-left text-[12px] text-white opacity-0 transition group-hover:opacity-100">
                        点击预览
                      </div>
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(event) => {
                          event.stopPropagation()
                          setReferenceImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))
                        }}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-slate-500">尺寸</span>
                  <select
                    value={`${width}x${height}`}
                    onChange={(e) => {
                      const option = aspectOptions.find((item) => `${item.width}x${item.height}` === e.target.value)
                      if (option) {
                        setWidth(option.width)
                        setHeight(option.height)
                      }
                    }}
                    className="h-10 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-[14px] text-slate-700 outline-none focus:border-[#f5c233]"
                  >
                    {aspectOptions.map((item) => (
                      <option key={item.label} value={`${item.width}x${item.height}`}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-slate-500">数量</span>
                  <select
                    value={numImages}
                    onChange={(e) => setNumImages(Number(e.target.value))}
                    className="h-10 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-[14px] text-slate-700 outline-none focus:border-[#f5c233]"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </label>
              </div>


              {error ? (
                <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#f5c233] px-5 py-2.5 text-[14px] font-bold text-[#2e1a14] shadow-[0_8px_18px_rgba(245,194,51,0.2)] transition hover:bg-[#efba18] disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {isGenerating ? '生成中' : '生成'}
              </button>
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto px-5 py-4">
            {result ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-500">任务 {result.request_id}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-500">{result.images.length} 张</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-500">{width && height ? `${width}×${height}` : '自动尺寸'}</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {result.images.map((item, index) => {
                    const src = item.url || (item.base64 ? `data:image/png;base64,${item.base64}` : '')
                    return (
                      <article
                        key={`${result.request_id}-${index}`}
                        className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50"
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          {src ? (
                            <Image
                              src={src}
                              alt={`result ${index + 1}`}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                              Empty
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-2">
                          <p className="text-[13px] font-medium text-[#2e1a14]">结果 {index + 1}</p>
                          <p className="mt-1 truncate text-[12px] text-slate-500">{item.url || 'base64'}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0c6] text-[#d69200]">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-[14px] font-medium text-slate-500">生成结果会显示在这里</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {previewImage ? (
        <button
          type="button"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          aria-label="关闭图片预览"
        >
          <div className="relative h-[min(78vh,760px)] w-[min(92vw,760px)] overflow-hidden rounded-[20px] bg-black shadow-2xl">
            <Image src={previewImage} alt="参考图预览" fill className="object-contain" unoptimized />
          </div>
        </button>
      ) : null}
    </main>
  )
}
