'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Plus, Edit2, Trash2, Save, X, Loader2, FileText, Calendar, ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'

interface Tag { id: string; name: string }
interface Category { id: string; name: string }

interface Post {
  id: string
  title: string
  slug: string | null
  content: string
  excerpt: string | null
  coverImage: string | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  tags: Tag[]
  categories: Category[]
}

type FormData = {
  title: string
  content: string
  excerpt: string
  coverImage: string
  published: boolean
  tags: string
  categories: string
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    published: false,
    tags: '',
    categories: '',
  })

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error()
      setPosts(await res.json())
      setError('')
    } catch {
      setError('加载文章失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const openNew = () => {
    setEditingPost(null)
    setForm({ title: '', content: '', excerpt: '', coverImage: '', published: false, tags: '', categories: '' })
    setError('')
    setShowEditor(true)
  }

  const openEdit = (post: Post) => {
    setEditingPost(post)
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      coverImage: post.coverImage || '',
      published: post.published,
      tags: post.tags.map((t) => t.name).join(', '),
      categories: post.categories.map((c) => c.name).join(', '),
    })
    setError('')
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('标题不能为空')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts'
      const method = editingPost ? 'PATCH' : 'POST'
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      const categories = form.categories.split(',').map((c) => c.trim()).filter(Boolean)
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags, categories, wasPublished: editingPost?.published }),
      })
      if (!res.ok) throw new Error()
      setShowEditor(false)
      await loadPosts()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`确认删除「${post.title}」？此操作不可撤销。`)) return
    setDeletingId(post.id)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await loadPosts()
    } catch {
      setError('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  const togglePublish = async (post: Post) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title, content: post.content,
          excerpt: post.excerpt, coverImage: post.coverImage,
          published: !post.published, wasPublished: post.published,
          tags: post.tags.map((t) => t.name),
          categories: post.categories.map((c) => c.name),
        }),
      })
      if (!res.ok) throw new Error()
      await loadPosts()
    } catch {
      setError('状态更新失败')
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
              <Link href="/" className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                返回博客
              </Link>
              <span className="text-slate-800">|</span>
              <span className="text-xs font-mono text-cyan-400 tracking-widest">// 文章管理</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadPosts} className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors" title="刷新">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-cyan-500/40 bg-cyan-500/8 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/60 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                新建文章
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
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/40" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/40" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/40" />

              {/* Editor header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-mono text-slate-200">
                    {editingPost ? `编辑 · ${editingPost.title}` : '新建文章'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => setShowEditor(false)} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-0">
                {/* Left: content */}
                <div className="xl:col-span-2 p-6 space-y-4 border-r border-slate-800/50">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">标题</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-cyan-500/50 text-slate-100 font-mono text-sm outline-none transition-colors placeholder:text-slate-700"
                      placeholder="文章标题"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">摘要</label>
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-cyan-500/50 text-slate-300 font-mono text-sm outline-none transition-colors resize-none placeholder:text-slate-700"
                      placeholder="文章摘要（可选，用于首页卡片展示）"
                    />
                  </div>

                  {/* Rich text content */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">内容</label>
                    <RichTextEditor
                      content={form.content}
                      onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                      placeholder="开始写作..."
                      minHeight="480px"
                    />
                  </div>
                </div>

                {/* Right: metadata */}
                <div className="p-6 space-y-5">
                  {/* Publish toggle */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-2 tracking-wider">状态</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, published: !form.published })}
                      className={`flex items-center gap-2 px-3 py-2 w-full border text-xs font-mono transition-all ${
                        form.published
                          ? 'border-green-500/40 bg-green-500/8 text-green-400'
                          : 'border-slate-700 bg-slate-900/50 text-slate-500'
                      }`}
                    >
                      {form.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {form.published ? '已发布' : '草稿'}
                    </button>
                  </div>

                  {/* Cover image */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-2 tracking-wider">封面图</label>
                    <ImageUpload
                      multiple={false}
                      maxFiles={1}
                      value={form.coverImage ? [form.coverImage] : []}
                      onChange={(urls) => setForm({ ...form, coverImage: urls[0] || '' })}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">标签</label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-purple-500/50 text-purple-400/80 font-mono text-xs outline-none transition-colors placeholder:text-slate-700"
                      placeholder="AI, 技术, 生活"
                    />
                    <p className="text-xs text-slate-700 font-mono mt-1">逗号分隔</p>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-wider">分类</label>
                    <input
                      type="text"
                      value={form.categories}
                      onChange={(e) => setForm({ ...form, categories: e.target.value })}
                      className="w-full px-3 py-2 bg-[#080810] border border-slate-800 focus:border-cyan-500/50 text-cyan-400/80 font-mono text-xs outline-none transition-colors placeholder:text-slate-700"
                      placeholder="技术, 随笔"
                    />
                    <p className="text-xs text-slate-700 font-mono mt-1">逗号分隔</p>
                  </div>

                  {error && (
                    <div className="px-3 py-2 border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-mono">
                      [错误] {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Post list ── */
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-lg font-mono font-bold text-slate-200">
                    <span className="text-cyan-500">&gt;</span> 文章管理
                  </h1>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    共 {posts.length} 篇，已发布 {posts.filter(p => p.published).length} 篇
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500/50" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-24 border border-slate-800">
                  <FileText className="w-8 h-8 mx-auto text-slate-700 mb-3" />
                  <p className="text-xs font-mono text-slate-600">
                    <span className="text-cyan-500">&gt;</span> 暂无文章，点击「新建文章」开始写作
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800">
                    {['标题', '状态', '日期', '操作'].map((h) => (
                      <span key={h} className="text-xs font-mono text-slate-600 tracking-widest">{h}</span>
                    ))}
                  </div>

                  {posts.map((post, idx) => (
                    <div
                      key={post.id}
                      className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-cyan-500/3 transition-colors ${idx < posts.length - 1 ? 'border-b border-slate-800/60' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-slate-700">[{String(idx + 1).padStart(2, '0')}]</span>
                          <span className="text-sm font-mono text-slate-200 truncate max-w-md">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-8">
                          {post.tags.slice(0, 2).map((t) => (
                            <span key={t.id} className="text-xs font-mono text-purple-500/60">#{t.name}</span>
                          ))}
                          {post.categories.slice(0, 1).map((c) => (
                            <span key={c.id} className="text-xs font-mono text-cyan-600/60">[{c.name}]</span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => togglePublish(post)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border transition-all ${
                          post.published
                            ? 'border-green-500/30 bg-green-500/8 text-green-400 hover:bg-green-500/15'
                            : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {post.published ? '已发布' : '草稿'}
                      </button>

                      <div className="flex items-center gap-1 text-xs font-mono text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt ? dayjs(post.publishedAt).format('YYYY-MM-DD') : dayjs(post.createdAt).format('YYYY-MM-DD')}
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/posts/${post.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"
                          title="查看文章"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEdit(post)}
                          className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
                          title="删除"
                        >
                          {deletingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
