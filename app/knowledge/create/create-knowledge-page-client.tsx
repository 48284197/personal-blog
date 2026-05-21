'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, FileText, Link2, Loader2, Sparkles } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const KNOWLEDGE_PATH = '/knowledge'

type AuthProfile = {
  id?: string
  name: string
  email?: string | null
  avatarUrl?: string | null
}

type FormState = {
  title: string
  summary: string
  content: string
  category: string
  tags: string
  sourceUrl: string
  sourcePlatform: string
  sourceTitle: string
  sourceAuthorName: string
  sourceAuthorAvatar: string
  sourceCoverUrl: string
}

type CategoryOption = {
  value: string
  label: string
}

type PlatformOption = {
  value: string
  label: string
  color: string
}

type CreateKnowledgeMeta = {
  categories: CategoryOption[]
  platforms: PlatformOption[]
}

type ParsedKnowledgeLink = Partial<FormState> & {
  tags?: string[]
}

const inputClassName =
  'w-full rounded-[18px] border border-[#e8dcc9] bg-[#fffdf9] px-4 py-3 text-[14px] text-[#2e1a14] outline-none transition placeholder:text-[#b2a397] focus:border-[#f2c36c] focus:bg-white focus:ring-4 focus:ring-[#ffe9bb]/80'

function createInitialForm(defaultCategory = ''): FormState {
  return {
    title: '',
    summary: '',
    content: '',
    category: defaultCategory,
    tags: '',
    sourceUrl: '',
    sourcePlatform: '',
    sourceTitle: '',
    sourceAuthorName: '',
    sourceAuthorAvatar: '',
    sourceCoverUrl: '',
  }
}

export function CreateKnowledgePageClient() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(createInitialForm)
  const [meta, setMeta] = useState<CreateKnowledgeMeta>({ categories: [], platforms: [] })
  const [metaLoaded, setMetaLoaded] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseMessage, setParseMessage] = useState('')
  const [error, setError] = useState('')
  const [successTitle, setSuccessTitle] = useState('')

  const defaultCategory = meta.categories[0]?.value ?? ''

  useEffect(() => {
    let cancelled = false

    const loadMeta = async () => {
      try {
        const response = await fetch('/api/knowledge/meta', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('加载知识配置失败')
        }

        const data = (await response.json()) as CreateKnowledgeMeta
        if (!cancelled) {
          setMeta({
            categories: data.categories ?? [],
            platforms: data.platforms ?? [],
          })
          setMetaLoaded(true)
          setMetaError('')
        }
      } catch {
        if (!cancelled) {
          setMeta({ categories: [], platforms: [] })
          setMetaLoaded(true)
          setMetaError('分类和平台配置加载失败，稍后重试。')
        }
      }
    }

    void loadMeta()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!defaultCategory) return
    setForm((current) => (current.category ? current : { ...current, category: defaultCategory }))
  }, [defaultCategory])

  useEffect(() => {
    let cancelled = false

    const loadAuth = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          if (!cancelled) {
            setAuthProfile(null)
            setAuthLoaded(true)
          }
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          if (!cancelled) {
            setAuthProfile(null)
            setAuthLoaded(true)
          }
          return
        }

        const data = (await response.json()) as { user?: AuthProfile | null }
        if (!cancelled) {
          setAuthProfile(data.user ?? null)
          setAuthLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setAuthProfile(null)
          setAuthLoaded(true)
        }
      }
    }

    void loadAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const parsedTags = useMemo(() => {
    return Array.from(
      new Set(
        form.tags
          .split(/[\n,，]/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    )
  }, [form.tags])

  const previewTitle = form.title.trim() || form.sourceTitle.trim() || '未命名知识'
  const previewSummary =
    form.summary.trim() ||
    form.content.replace(/\s+/g, ' ').trim().slice(0, 88) ||
    '填写摘要或正文后，这里会显示知识简介。'
  const submitDisabled = loading || !form.sourceUrl.trim()
  const parseDisabled = parsing || !form.sourceUrl.trim()

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleParseLink = async () => {
    if (parseDisabled) return

    setParsing(true)
    setError('')
    setParseMessage('')

    try {
      const response = await fetch('/api/knowledge/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.sourceUrl.trim() }),
      })

      const data = (await response.json().catch(() => null)) as (ParsedKnowledgeLink & { message?: string }) | null
      if (!response.ok) {
        throw new Error(data?.message ?? '解析链接失败，请检查链接是否可以公开访问。')
      }

      setForm((current) => ({
        ...current,
        title: data?.title?.trim() || current.title,
        summary: data?.summary?.trim() || current.summary,
        content: data?.content?.trim() || current.content,
        sourceUrl: data?.sourceUrl?.trim() || current.sourceUrl,
        sourcePlatform: data?.sourcePlatform?.trim() || current.sourcePlatform,
        sourceTitle: data?.sourceTitle?.trim() || current.sourceTitle,
        sourceAuthorName: data?.sourceAuthorName?.trim() || current.sourceAuthorName,
        sourceAuthorAvatar: data?.sourceAuthorAvatar?.trim() || current.sourceAuthorAvatar,
        sourceCoverUrl: data?.sourceCoverUrl?.trim() || current.sourceCoverUrl,
        tags: data?.tags?.length ? data.tags.join(', ') : current.tags,
      }))
      setParseMessage('解析成功，已自动填充标题、摘要、标签和来源信息。')
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : '解析链接失败，请稍后重试。')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async () => {
    if (submitDisabled) return

    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title.trim() || undefined,
          summary: form.summary.trim() || undefined,
          content: form.content.trim() || undefined,
          category: form.category,
          tags: parsedTags,
          sourceUrl: form.sourceUrl.trim(),
          sourcePlatform: form.sourcePlatform || undefined,
          sourceTitle: form.sourceTitle.trim() || undefined,
          sourceAuthorName: form.sourceAuthorName.trim() || undefined,
          sourceAuthorAvatar: form.sourceAuthorAvatar.trim() || undefined,
          sourceCoverUrl: form.sourceCoverUrl.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? '创建知识失败，请稍后重试。')
      }

      const data = (await response.json()) as { item?: { title?: string } }
      router.prefetch(KNOWLEDGE_PATH)
      router.refresh()
      setSuccessTitle(data.item?.title?.trim() || previewTitle)
      setForm(createInitialForm(defaultCategory))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建知识失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  if (successTitle) {
    return (
      <section className="mx-auto max-w-[1520px] px-4 pb-14 pt-[136px] sm:px-6 xl:px-10 xl:pt-[100px]">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-[#e9ddcc] bg-white p-8 shadow-[0_24px_64px_rgba(91,71,45,0.08)] sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eff9ef] text-[#2e9e46]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-[30px] font-black text-[#241913] sm:text-[38px]">知识创建成功</h1>
          <p className="mt-3 text-[15px] leading-7 text-[#77675d]">
            <span className="font-semibold text-[#2e1a14]">{successTitle}</span>
            已经写入知识库，现在可以返回知识页查看，或者继续创建下一篇。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/knowledge')}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ffa90c] px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(255,169,12,0.24)] transition hover:bg-[#f39c00]"
            >
              查看知识页
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessTitle('')
                setError('')
              }}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#e8dcc9] bg-white px-6 text-[15px] font-bold text-[#5f5044] transition hover:bg-[#fff8eb]"
            >
              继续创建
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[1520px] px-4 pb-14 pt-[136px] sm:px-6 xl:px-10 xl:pt-[100px]">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.62fr]">
        <div className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-white shadow-[0_22px_60px_rgba(91,71,45,0.08)]">
          <div className="border-b border-[#f3ebe0] bg-[linear-gradient(110deg,#fffdfa_0%,#fff7e9_52%,#fffdf8_100%)] px-6 py-7 sm:px-8">
            <Link href="/knowledge" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#8a7a6e] hover:text-[#f39c00]">
              <ArrowLeft className="h-4 w-4" />
              返回知识页
            </Link>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#fff0c9] px-4 py-1.5 text-[12px] font-bold text-[#c27b00]">
                  <Sparkles className="h-3.5 w-3.5" />
                  创建知识
                </p>
                <h1 className="mt-4 text-[32px] font-black leading-tight text-[#241913] sm:text-[42px]">
                  添加一篇新的宠物知识
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#7b6c61]">
                  支持录入原平台链接、补充摘要和正文整理，将分散内容沉淀成结构化知识，方便用户统一浏览与搜索。
                </p>
              </div>
              <div className="rounded-[22px] border border-[#f3e6d2] bg-white/85 px-4 py-3 text-[13px] leading-6 text-[#7d6e62]">
                <div className="font-bold text-[#2e1a14]">建议填写</div>
                <div>原文链接、标题、分类、摘要、标签</div>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-7 sm:px-8">
            <section className="space-y-5">
              <div>
                <h2 className="text-[22px] font-black text-[#241913]">基础信息</h2>
                <p className="mt-1 text-[14px] text-[#8a7c71]">先补充知识标题、分类和正文整理。</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel title="知识标题" desc="留空时会自动取原文标题或平台默认标题" />
                  <input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    placeholder="例如：幼犬到家第一周照护清单"
                    className={inputClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel title="知识分类" />
                  <select
                    value={form.category}
                    onChange={(event) => updateField('category', event.target.value)}
                    disabled={!metaLoaded || meta.categories.length === 0}
                    className={inputClassName}
                  >
                    {!metaLoaded ? <option value="">分类加载中...</option> : null}
                    {metaLoaded && meta.categories.length === 0 ? <option value="">暂无可选分类</option> : null}
                    {meta.categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field>
                <FieldLabel title="知识摘要" desc="用于知识列表和卡片简介，建议 50-120 字" />
                <textarea
                  value={form.summary}
                  onChange={(event) => updateField('summary', event.target.value)}
                  rows={4}
                  placeholder="提炼这篇知识的核心结论、适用对象和使用场景。"
                  className={`${inputClassName} min-h-[112px] resize-y`}
                />
              </Field>

              <Field>
                <FieldLabel title="正文整理" desc="可填写你对原内容的整理、补充说明或重点摘录" />
                <textarea
                  value={form.content}
                  onChange={(event) => updateField('content', event.target.value)}
                  rows={8}
                  placeholder="例如：1. 到家前准备围栏和安全区；2. 前 3 天避免频繁洗澡和外出；3. 记录饮食、排便和精神状态..."
                  className={`${inputClassName} min-h-[220px] resize-y`}
                />
              </Field>

              <Field>
                <FieldLabel title="标签" desc="使用逗号或换行分隔，例如：幼犬, 新手, 适应期" />
                <textarea
                  value={form.tags}
                  onChange={(event) => updateField('tags', event.target.value)}
                  rows={3}
                  placeholder="输入标签，帮助知识页和搜索页更快聚合内容"
                  className={`${inputClassName} min-h-[92px] resize-y`}
                />
                {parsedTags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#fff3d8] px-3 py-1 text-[12px] font-semibold text-[#b87400]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Field>
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="text-[22px] font-black text-[#241913]">来源信息</h2>
                <p className="mt-1 text-[14px] text-[#8a7c71]">原文链接为必填，其他信息可用于丰富展示效果。</p>
              </div>

              <Field>
                <FieldLabel title="原文链接" desc="必填，粘贴小红书链接后可快速解析网页 meta 内容" required />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8998d]" />
                    <input
                      value={form.sourceUrl}
                      onChange={(event) => {
                        updateField('sourceUrl', event.target.value)
                        setParseMessage('')
                      }}
                      placeholder="https://www.xiaohongshu.com/explore/..."
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleParseLink}
                    disabled={parseDisabled}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[18px] bg-[#ff2442] px-5 text-[14px] font-bold text-white shadow-[0_12px_26px_rgba(255,36,66,0.2)] transition hover:bg-[#e91d39] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {parsing ? '解析中...' : '快速解析'}
                  </button>
                </div>
                {parseMessage ? <p className="mt-3 text-[12px] font-semibold text-[#2e9e46]">{parseMessage}</p> : null}
              </Field>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <FieldLabel title="来源平台" desc="可选，不填时将根据链接自动识别" />
                  <span className="text-[12px] text-[#a29387]">{metaLoaded ? '点击快速选择' : '平台加载中...'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meta.platforms.map((platform) => {
                    const active = form.sourcePlatform === platform.value
                    return (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => updateField('sourcePlatform', active ? '' : platform.value)}
                        className={[
                          'rounded-full px-4 py-2 text-[13px] font-bold transition',
                          active ? `${platform.color} shadow-[0_10px_22px_rgba(15,23,42,0.14)]` : 'bg-[#f7f2eb] text-[#6f6155] hover:bg-[#efe7db]',
                        ].join(' ')}
                      >
                        {platform.label}
                      </button>
                    )
                  })}
                </div>
                {metaError ? <p className="mt-3 text-[12px] text-[#c36a5d]">{metaError}</p> : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel title="原文标题" />
                  <input
                    value={form.sourceTitle}
                    onChange={(event) => updateField('sourceTitle', event.target.value)}
                    placeholder="原平台展示的标题"
                    className={inputClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel title="原作者名称" />
                  <input
                    value={form.sourceAuthorName}
                    onChange={(event) => updateField('sourceAuthorName', event.target.value)}
                    placeholder="例如：宠物行为研究所"
                    className={inputClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel title="原作者头像链接" />
                  <input
                    value={form.sourceAuthorAvatar}
                    onChange={(event) => updateField('sourceAuthorAvatar', event.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={inputClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel title="封面图链接" />
                  <input
                    value={form.sourceCoverUrl}
                    onChange={(event) => updateField('sourceCoverUrl', event.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className={inputClassName}
                  />
                </Field>
              </div>
            </section>

            {error ? (
              <div className="rounded-[22px] border border-[#f5c8c8] bg-[#fff4f4] px-5 py-4 text-[14px] text-[#c05151]">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f2e7d8] pt-6">
              <div className="text-[13px] leading-6 text-[#8f8176]">
                {authLoaded ? (
                  authProfile ? (
                    <span>
                      当前将以 <span className="font-bold text-[#2e1a14]">{authProfile.name}</span> 的身份发布这篇知识。
                    </span>
                  ) : (
                    <span>
                      当前未登录，系统会尝试使用默认平台用户创建。
                      <Link href="/login" className="ml-1 font-semibold text-[#f39c00] hover:underline">
                        去登录
                      </Link>
                    </span>
                  )
                ) : (
                  <span>正在检查登录状态...</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/knowledge"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#eadfce] bg-white px-6 text-[15px] font-bold text-[#5f5044] transition hover:bg-[#fff8eb]"
                >
                  取消
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitDisabled}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ffa90c] px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(255,169,12,0.24)] transition hover:bg-[#f39c00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? '创建中...' : '创建知识'}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-[100px] xl:self-start">
          <div className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_18px_50px_rgba(91,71,45,0.06)]">
            <div className="border-b border-[#f3ebe0] px-6 py-5">
              <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#af9d8d]">Preview</p>
              <h2 className="mt-2 text-[24px] font-black text-[#241913]">知识预览</h2>
            </div>
            <div className="p-6">
              <div className="overflow-hidden rounded-[24px] border border-[#f0e5d6] bg-[#fffdf9]">
                <div className="aspect-[1.3] bg-[linear-gradient(135deg,#fff0cb_0%,#fff9ed_45%,#f8efe4_100%)]">
                  {form.sourceCoverUrl.trim() ? (
                    <div
                      aria-label={previewTitle}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${form.sourceCoverUrl.trim()}")` }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#d4b46c]">
                      <FileText className="h-10 w-10" />
                      <span className="text-[14px] font-semibold">封面预览区域</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fff3d8] px-3 py-1 text-[12px] font-bold text-[#c27b00]">{form.category || '未选择分类'}</span>
                    <span className="rounded-full bg-[#f6f0e7] px-3 py-1 text-[12px] font-semibold text-[#7b6d62]">
                      {meta.platforms.find((item) => item.value === form.sourcePlatform)?.label || '自动识别平台'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[20px] font-black leading-7 text-[#241913]">{previewTitle}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-[#7c6e63]">{previewSummary}</p>
                  {parsedTags.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parsedTags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-[#f7f2eb] px-3 py-1 text-[12px] text-[#847568]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#eadfce] bg-white p-6 shadow-[0_18px_50px_rgba(91,71,45,0.06)]">
            <h3 className="text-[22px] font-black text-[#241913]">创建提示</h3>
            <div className="mt-4 space-y-4 text-[14px] leading-7 text-[#7a6b60]">
              <p>1. 原文链接必填，用来沉淀知识并保留出处。</p>
              <p>2. 摘要决定列表卡片展示效果，尽量概括结论与亮点。</p>
              <p>3. 正文可填写你的整理内容，不必逐字复制原文。</p>
              <p>4. 标签越清晰，搜索和分类聚合效果越好。</p>
            </div>
            <a
              href={form.sourceUrl.trim() || '#'}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-[#f39c00] hover:underline"
            >
              预览原文链接
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

function FieldLabel({ title, desc, required = false }: { title: string; desc?: string; required?: boolean }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <label className="text-[14px] font-bold text-[#2e1a14]">{title}</label>
        {required ? <span className="text-[12px] font-bold text-[#e46d5e]">*</span> : null}
      </div>
      {desc ? <p className="mt-1 text-[12px] leading-5 text-[#998b80]">{desc}</p> : null}
    </div>
  )
}
