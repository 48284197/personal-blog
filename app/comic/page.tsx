'use client'

import { useState } from 'react'
import { Loader2, Download, Share2, Sparkles, Image as ImageIcon } from 'lucide-react'

export default function ComicPage() {
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [model, setModel] = useState('jimeng-v1.4')
  const [style, setStyle] = useState('anime')
  const [ratio, setRatio] = useState('16:9')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string, description: string, frame: number }>>([])
  const [progress, setProgress] = useState(0)

  const models = [
    { value: 'jimeng-v1.4', label: '集梦影视v1.4' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'gpt-image', label: 'GPT Image' }
  ]

  const styles = [
    { value: 'anime', label: '日漫风格' },
    { value: 'american', label: '美漫风格' },
    { value: 'chinese', label: '国漫风格' },
    { value: 'realistic', label: '写实风格' }
  ]

  const ratios = [
    { value: '16:9', label: '16:9 (宽屏)' },
    { value: '4:3', label: '4:3 (电影)' },
    { value: '1:1', label: '1:1 (方形)' }
  ]

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setGeneratedImages([])
    setLoading(true)
    setProgress(0)

    try {
      const response = await fetch('/api/comic/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          story,
          model,
          style,
          ratio
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '生成失败')
      }

      setGeneratedImages(data.images)
      setSuccess(true)
    } catch (err) {
      setError((err as Error).message || '生成失败，请重试')
    } finally {
      setLoading(false)
      setProgress(100)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }

  const handleDownloadAll = async () => {
    for (let i = 0; i < generatedImages.length; i++) {
      await handleDownload(generatedImages[i].url, `comic-frame-${i + 1}.png`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || '我的AI漫画',
          text: story,
          url: window.location.href
        })
      } catch (err) {
        console.error('分享失败:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  const inputClass = "w-full px-4 py-3 border border-slate-700 bg-[#0e0e1a] text-slate-100 focus:outline-none focus:border-cyan-500/60 focus:shadow-[0_0_0_1px_rgba(0,212,255,0.2)] font-mono text-sm placeholder:text-slate-600 transition-all"
  const selectClass = "w-full px-4 py-3 border border-slate-700 bg-[#0e0e1a] text-slate-100 focus:outline-none focus:border-cyan-500/60 font-mono text-sm transition-all"
  const labelClass = "block text-xs font-mono tracking-wider text-slate-400 mb-2 uppercase"

  return (
    <div
      className="min-h-screen"
      style={{ background: '#080810' }}
    >
      {/* 背景网格 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      {/* 顶部辉光 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,212,255,0.07), transparent)'
        }}
      />

      <main className="relative pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 页面标题 */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-cyan-500 font-mono text-sm">{'>'}</span>
              <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">ai_comic_generator</span>
            </div>
            <h1 className="text-3xl font-bold font-mono mb-3 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }} />
              <span
                className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                AI漫画生成器
              </span>
              <span className="text-cyan-400 animate-pulse">▌</span>
            </h1>
            <p className="text-sm font-mono text-slate-500 tracking-wide">
              // 输入故事文字，AI自动生成精美漫画
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 左栏：创建表单 */}
            <div className="relative border border-slate-800 bg-[#0e0e1a] p-6 group hover:border-cyan-500/20 transition-colors">
              {/* 四角装饰 */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 group-hover:border-cyan-400/70 transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 group-hover:border-cyan-400/70 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 group-hover:border-cyan-400/70 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 group-hover:border-cyan-400/70 transition-colors" />

              <h2 className="text-sm font-mono tracking-widest text-cyan-400 mb-6 uppercase">
                // 创建漫画
              </h2>

              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label className={labelClass}>漫画标题</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="给你的漫画起个名字"
                  />
                </div>

                <div>
                  <label className={labelClass}>故事内容</label>
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    required
                    rows={10}
                    className={`${inputClass} resize-none`}
                    placeholder={"在这里输入你的故事内容，每段话会生成一帧漫画\n\n\n例如：\n\n小明今天去公园玩，遇到了一只可爱的小狗。\n\n他们一起玩飞盘，玩得很开心。\n\n傍晚时分，小明和小狗依依不舍地告别。\n\n小明期待着明天再和小狗一起玩。"}
                  />
                  <p className="text-xs font-mono text-slate-600 mt-1.5">
                    {'// 每段话会生成一帧漫画'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>AI模型</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className={selectClass}
                    >
                      {models.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>漫画风格</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className={selectClass}
                    >
                      {styles.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>画面比例</label>
                    <select
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                      className={selectClass}
                    >
                      {ratios.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="relative border border-red-800/60 bg-red-900/10 p-4">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/60" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/60" />
                    <p className="text-xs font-mono text-red-400">{`// error: ${error}`}</p>
                  </div>
                )}

                {success && (
                  <div className="relative border border-cyan-800/60 bg-cyan-900/10 p-4">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/60" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/60" />
                    <p className="text-xs font-mono text-cyan-400">{'// 漫画生成成功！'}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-mono text-sm tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400/60 hover:shadow-[0_0_16px_rgba(0,212,255,0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      开始生成漫画
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 右栏：生成结果 */}
            <div className="relative border border-slate-800 bg-[#0e0e1a] p-6 group hover:border-cyan-500/20 transition-colors">
              {/* 四角装饰 */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-500/40 group-hover:border-purple-400/70 transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-purple-500/40 group-hover:border-purple-400/70 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-purple-500/40 group-hover:border-purple-400/70 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-purple-500/40 group-hover:border-purple-400/70 transition-colors" />

              <h2 className="text-sm font-mono tracking-widest text-purple-400 mb-6 uppercase flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                // 生成结果
              </h2>

              {loading && (
                <div className="space-y-6 py-8">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }} />
                    <p className="mt-4 text-xs font-mono text-slate-500 tracking-wider">
                      {'// AI正在创作你的漫画...'}
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 h-px relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(0,212,255,0.6)' }}
                    />
                  </div>
                </div>
              )}

              {!loading && generatedImages.length === 0 && (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <ImageIcon className="w-14 h-14 mx-auto text-slate-700 mb-4" />
                  </div>
                  <p className="text-xs font-mono text-slate-600 tracking-wider">
                    {'// 还没有生成漫画'}
                  </p>
                  <p className="text-xs font-mono text-slate-700 mt-1">
                    {'// 在左侧输入故事开始创作'}
                  </p>
                </div>
              )}

              {!loading && generatedImages.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-mono text-slate-200 tracking-wide truncate">
                      {title || '未命名漫画'}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 bg-slate-800/50 text-slate-300 font-mono text-xs tracking-wider hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下载全部
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 bg-slate-800/50 text-slate-300 font-mono text-xs tracking-wider hover:border-purple-500/40 hover:text-purple-400 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        分享
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedImages.map((image, index) => (
                      <div
                        key={image.frame}
                        className="group relative bg-slate-900 border border-slate-800 overflow-hidden hover:border-cyan-500/30 transition-colors"
                      >
                        {/* 帧号标签 */}
                        <div className="absolute top-2 left-2 z-10 bg-[#080810]/90 border border-cyan-500/30 px-2 py-0.5">
                          <span className="text-xs font-mono text-cyan-400">
                            frame_{String(image.frame).padStart(2, '0')}
                          </span>
                        </div>
                        <img
                          src={image.url}
                          alt={`第${image.frame}帧`}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* hover 遮罩 */}
                        <div className="absolute inset-0 bg-[#080810]/0 group-hover:bg-[#080810]/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleDownload(image.url, `comic-frame-${image.frame}.png`)}
                            className="p-2.5 border border-cyan-500/50 bg-[#080810]/80 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
