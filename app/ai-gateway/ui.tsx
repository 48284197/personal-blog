'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  Activity,
  Check,
  Copy,
  KeyRound,
  Plus,
  Power,
  RefreshCw,
  Route,
  Server,
  Trash2,
} from 'lucide-react'

type Provider = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  priority: number
  isActive: boolean
  balanceInsufficient: boolean
  balanceInsufficientAt: string | null
  notes: string | null
}

type GatewayKey = {
  id: string
  name: string
  maskedKey: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

type ProviderForm = {
  id?: string
  name: string
  baseUrl: string
  apiKey: string
  priority: number
  isActive: boolean
  notes: string
}

const emptyProvider: ProviderForm = {
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  priority: 100,
  isActive: true,
  notes: '',
}

function formatTime(value?: string | null) {
  if (!value) return '从未'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function providerToForm(provider: Provider): ProviderForm {
  return {
    id: provider.id,
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: '',
    priority: provider.priority,
    isActive: provider.isActive,
    notes: provider.notes ?? '',
  }
}

export function AiGatewayConsole() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [keys, setKeys] = useState<GatewayKey[]>([])
  const [providerForm, setProviderForm] = useState<ProviderForm>(emptyProvider)
  const [keyName, setKeyName] = useState('Personal SDK')
  const [newKey, setNewKey] = useState('')
  const [message, setMessage] = useState('')
  const [gatewayBaseUrl, setGatewayBaseUrl] = useState('/api/v1')
  const [loading, setLoading] = useState(true)
  const [savingProvider, setSavingProvider] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)

  async function loadData() {
    setLoading(true)
    const [providerResponse, keyResponse] = await Promise.all([
      fetch('/api/ai-gateway/providers', { cache: 'no-store' }),
      fetch('/api/ai-gateway/keys', { cache: 'no-store' }),
    ])

    if (providerResponse.ok) {
      const providerData = await providerResponse.json()
      setProviders(providerData.providers ?? [])
    }

    if (keyResponse.ok) {
      const keyData = await keyResponse.json()
      setKeys(keyData.keys ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    setGatewayBaseUrl(`${window.location.origin}/api/v1`)
    loadData().catch(() => {
      setMessage('加载配置失败')
      setLoading(false)
    })
  }, [])

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingProvider(true)
    setMessage('')

    const response = await fetch('/api/ai-gateway/providers', {
      method: providerForm.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerForm),
    })

    const data = await response.json()
    if (!response.ok) {
      setMessage(data.message ?? '保存失败')
      setSavingProvider(false)
      return
    }

    setMessage(providerForm.id ? '上游已更新' : '上游已创建')
    setProviderForm(emptyProvider)
    await loadData()
    setSavingProvider(false)
  }

  async function deleteProvider(id: string) {
    const response = await fetch(`/api/ai-gateway/providers?id=${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessage('删除上游失败')
      return
    }
    setMessage('上游已删除')
    await loadData()
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingKey(true)
    setMessage('')
    setNewKey('')

    const response = await fetch('/api/ai-gateway/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: keyName }),
    })

    const data = await response.json()
    if (!response.ok) {
      setMessage(data.message ?? '创建 Key 失败')
      setCreatingKey(false)
      return
    }

    setNewKey(data.plainKey)
    setMessage('Key 已创建')
    await loadData()
    setCreatingKey(false)
  }

  async function toggleKey(key: GatewayKey) {
    const response = await fetch('/api/ai-gateway/keys', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key.id, isActive: !key.isActive }),
    })
    if (!response.ok) {
      setMessage('更新 Key 失败')
      return
    }
    await loadData()
  }

  async function deleteKey(id: string) {
    const response = await fetch(`/api/ai-gateway/keys?id=${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessage('删除 Key 失败')
      return
    }
    setMessage('Key 已删除')
    await loadData()
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    setMessage('已复制')
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <Activity className="h-4 w-4" />
              OpenAI Compatible Gateway
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              AI 中转控制台
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Base URL: <span className="font-semibold text-slate-900">{gatewayBaseUrl}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </header>

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                  <Server className="h-5 w-5 text-emerald-600" />
                  上游服务
                </h2>
                <p className="mt-1 text-sm text-slate-500">聚合 OpenAI 官方或其他中转站。</p>
              </div>
              <button
                type="button"
                onClick={() => setProviderForm(emptyProvider)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                新增
              </button>
            </div>

            <form onSubmit={submitProvider} className="mt-5 grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  名称
                  <input
                    value={providerForm.name}
                    onChange={(event) => setProviderForm({ ...providerForm, name: event.target.value })}
                    className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="OpenAI 官方"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  优先级
                  <input
                    type="number"
                    value={providerForm.priority}
                    onChange={(event) =>
                      setProviderForm({ ...providerForm, priority: Number(event.target.value) })
                    }
                    className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Base URL
                <input
                  value={providerForm.baseUrl}
                  onChange={(event) => setProviderForm({ ...providerForm, baseUrl: event.target.value })}
                  className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="https://api.openai.com/v1"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                上游 Key
                <input
                  value={providerForm.apiKey}
                  onChange={(event) => setProviderForm({ ...providerForm, apiKey: event.target.value })}
                  className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder={providerForm.id ? '留空则保持原 Key' : 'sk-...'}
                  required={!providerForm.id}
                />
              </label>

              <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={providerForm.isActive}
                  onChange={(event) =>
                    setProviderForm({ ...providerForm, isActive: event.target.checked })
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
                启用上游
              </label>

              <button
                type="submit"
                disabled={savingProvider}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {savingProvider ? '保存中' : providerForm.id ? '保存上游' : '创建上游'}
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {loading ? <div className="text-sm text-slate-500">加载中</div> : null}
              {providers.map((provider) => (
                <div key={provider.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{provider.name}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${provider.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {provider.isActive ? '启用' : '停用'}
                        </span>
                        {provider.balanceInsufficient ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                            余额不足
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">{provider.baseUrl}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Key: {provider.apiKey} · 优先级 {provider.priority}
                      </p>
                      {provider.balanceInsufficientAt ? (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          标记时间: {formatTime(provider.balanceInsufficientAt)}，下周一自动重置
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProviderForm(providerToForm(provider))}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        aria-label="删除上游"
                        onClick={() => deleteProvider(provider.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="grid content-start gap-6">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <KeyRound className="h-5 w-5 text-emerald-600" />
                客户端 Key
              </h2>

              <form onSubmit={createKey} className="mt-4 flex gap-2">
                <input
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-base font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Key 名称"
                  required
                />
                <button
                  type="submit"
                  disabled={creatingKey}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  创建
                </button>
              </form>

              {newKey ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-sm font-black text-amber-900">只显示一次</div>
                  <div className="mt-2 flex gap-2">
                    <code className="min-w-0 flex-1 overflow-auto rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-amber-200">
                      {newKey}
                    </code>
                    <button
                      type="button"
                      aria-label="复制新 Key"
                      onClick={() => copyText(newKey)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-800 ring-1 ring-amber-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                {keys.map((key) => (
                  <div key={key.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-950">{key.name}</div>
                        <div className="mt-1 font-mono text-xs text-slate-600">{key.maskedKey}</div>
                        <div className="mt-2 text-xs text-slate-500">最近使用: {formatTime(key.lastUsedAt)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="切换 Key 状态"
                          onClick={() => toggleKey(key)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${key.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="删除 Key"
                          onClick={() => deleteKey(key.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Route className="h-5 w-5 text-emerald-600" />
                接口
              </h2>
              <div className="mt-4 grid gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-slate-500">Base URL</div>
                  <div className="mt-1 flex gap-2">
                    <code className="min-w-0 flex-1 overflow-auto rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900">
                      {gatewayBaseUrl}
                    </code>
                    <button
                      type="button"
                      aria-label="复制 Base URL"
                      onClick={() => copyText(gatewayBaseUrl)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{`curl ${gatewayBaseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-maoqiu-..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}'`}
                </pre>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
