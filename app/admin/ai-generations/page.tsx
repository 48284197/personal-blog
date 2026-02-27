'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Plus, Edit2, Trash2, Save, X, Loader2, Sparkles, Calendar, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'

interface AiGeneration {
  id: number
  title: string
  aiTool: string
  prompt: string
  inputParams: string | null
  output: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

type FormData = {
  title: string
  aiTool: string
  prompt: string
  inputParams: string
  output: string
  tags: string
}

export default function AdminAiGenerationsPage() {
  const [generations, setGenerations] = useState<AiGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingGen, setEditingGen] = useState<AiGeneration | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    aiTool: '',
    prompt: '',
    inputParams: '',
    output: '',
    tags: '',
  })

  const loadGenerations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ai-generations')
      if (!res.ok) throw new Error()
      setGenerations(await res.json())
      setError('')
    } catch {
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGenerations() }, [loadGenerations])

  const openNew = () => {
    setEditingGen(null)
    setForm({ title: '', aiTool: '', prompt: '', inputParams: '', output: '', tags: '' })
    setError('')
    setShowEditor(true)
  }

  const openEdit = (gen: AiGeneration) => {
    setEditingGen(gen)
    setForm({
      title: gen.title,
      aiTool: gen.aiTool,
      prompt: gen.prompt,
      inputParams: gen.inputParams || '',
      output: gen.output,
      tags: gen.tags.join(', '),
    })
    setError('')
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('标题不能为空')
      return
    }
    if (!form.aiTool.trim()) {
      setError('AI 工具不能为空')
      return
    }
    if (!form.prompt.trim()) {
      setError('提示词不能为空')
      return
    }
    if (!form.output.trim()) {
      setError('输出结果不能为空')
      return
    }

    setSaving(true)
    setError('')
    try {
      const url = editingGen ? `/api/ai-generations/${editingGen.id}` : '/api/ai-generations'
      const method = editingGen ? 'PUT' : 'POST'
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags }),
      })
      
      if (!res.ok) throw new Error()
      setShowEditor(false)
      await loadGenerations()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (gen: AiGeneration) => {
    if (!confirm(`确认删除「${gen.title}」？此操作不可撤销。`)) return
    setDeletingId(gen.id)
    try {
      const res = await fetch(`/api/ai-generations/${gen.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await loadGenerations()
    } catch {
      setError('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-lg border-b border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <BackButton className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors" />
              <span className="text-slate-800">|</span>
        
              <span className="text-xs font-mono text-purple-400 tracking-widest">// AI 产物管理</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadGenerations} className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors" title="刷新">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-purple-500/40 bg-purple-500/8 text-purple-400 hover:bg-purple-500/15 hover:border-purple-500/60 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                新建 AI 产物
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {error && !showEditor && (
            <div className="mb-4 px-4 py-2 border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-mono flex items-center justify-between">
              <span>[错误] {error}</span>
              <button onClick={() => setError('')}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {showEditor ? (
            /* ── Editor ── */
            <div className="bg-[#0e0e1a] border border-slate-800 relative">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-purple-500/40" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-purple-500/40" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-cyan-500/40" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-500/40" />

              {/* Editor header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-mono text-slate-200">
                    {editingGen ? `编辑 · ${editingGen.title}` : '新建 AI 产物'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => setShowEditor(false)} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="px-3 py-2 border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-mono">
                    [错误] {error}
                  </div>
                )}

                {/* Title & AI Tool */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">标题</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-purple-500/50 text-slate-100 font-mono text-sm outline-none transition-colors placeholder:text-slate-700"
                      placeholder="给这个 AI 产物起个名字"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">AI 工具</label>
                    <input
                      type="text"
                      value={form.aiTool}
                      onChange={(e) => setForm({ ...form, aiTool: e.target.value })}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-cyan-500/50 text-cyan-400/80 font-mono text-sm outline-none transition-colors placeholder:text-slate-700"
                      placeholder="如: ChatGPT, Claude, Midjourney"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">标签</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-purple-500/50 text-purple-400/80 font-mono text-sm outline-none transition-colors placeholder:text-slate-700"
                    placeholder="AI, 提示词, 代码生成, 图像生成"
                  />
                  <p className="text-xs text-slate-700 font-mono mt-1">逗号分隔</p>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">提示词 (Prompt)</label>
                  <RichTextEditor
                    content={form.prompt}
                    onChange={(html) => setForm({ ...form, prompt: html })}
                    placeholder="输入你使用的提示词..."
                    minHeight="200px"
                  />
                </div>

                {/* Input Params */}
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">输入参数 (可选)</label>
                  <RichTextEditor
                    content={form.inputParams}
                    onChange={(html) => setForm({ ...form, inputParams: html })}
                    placeholder="模型参数、温度设置等 JSON 格式或其他参数..."
                    minHeight="120px"
                  />
                </div>

                {/* Output */}
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">输出结果</label>
                  <RichTextEditor
                    content={form.output}
                    onChange={(html) => setForm({ ...form, output: html })}
                    placeholder="AI 生成的输出内容..."
                    minHeight="320px"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── List ── */
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-lg font-mono font-bold text-slate-200">
                    <span className="text-purple-500">~</span> AI 产物管理
                  </h1>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    共 {generations.length} 条记录
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500/50" />
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-24 border border-slate-800">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-700 mb-3" />
                  <p className="text-xs font-mono text-slate-600">
                    <span className="text-purple-500">~</span> 暂无数据，点击「新建 AI 产物」开始添加
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800">
                    {['标题', 'AI 工具', '日期', '操作'].map((h) => (
                      <span key={h} className="text-xs font-mono text-slate-600 tracking-widest">{h}</span>
                    ))}
                  </div>

                  {generations.map((gen, idx) => (
                    <div
                      key={gen.id}
                      className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-purple-500/3 transition-colors ${idx < generations.length - 1 ? 'border-b border-slate-800/60' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-700">[{String(idx + 1).padStart(2, '0')}]</span>
                          <span className="text-sm font-mono text-slate-200 truncate max-w-md">{gen.title}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-8 mt-1">
                          {gen.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs font-mono text-purple-500/60">#{t}</span>
                          ))}
                        </div>
                      </div>

                      <span className="text-xs font-mono text-cyan-500/70">
                        {gen.aiTool}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-mono text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {dayjs(gen.createdAt).format('YYYY-MM-DD')}
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/ai-generations/${gen.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"
                          title="查看"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => openEdit(gen)}
                          className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(gen)}
                          disabled={deletingId === gen.id}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
                          title="删除"
                        >
                          {deletingId === gen.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
