import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowLeft, MessageSquareText, Sparkles, Users } from 'lucide-react'
import { AuthPanel } from '@/components/auth-panel'
import { Badge, Surface } from '@/components/landing'
import { brand } from '@/lib/site-data'

export const metadata: Metadata = {
  title: '登录',
}

type LoginPageProps = {
  searchParams?: Promise<{ mode?: string }>
}

const points = [
  {
    icon: MessageSquareText,
    title: '内容互动',
    text: '发内容、评论、收藏、追问都在一条链路里完成。',
  },
  {
    icon: Users,
    title: '身份显示',
    text: '登录后页面直接显示你的名字，方便参与社区。',
  },
  {
    icon: Sparkles,
    title: '协作入口',
    text: '后续共创、话题和知识沉淀都从这里开始。',
  },
]

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const initialMode = params?.mode === 'register' ? 'register' : 'login'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)]" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt={`${brand.name} logo`} width={44} height={44} className="h-11 w-11 rounded-2xl" priority />
          <div>
            <p className="text-sm font-semibold text-slate-900">{brand.name}</p>
            <p className="text-xs text-slate-500">{brand.slogan}</p>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
      </div>

      <div className="relative mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-6">
          <Badge tone="cyan">登录 / 注册</Badge>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
              进入社区，
              <span className="block bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-400 bg-clip-text text-transparent">
                开始真正的互动
              </span>
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              登录后你可以发内容、评论、@ 其他人、保存喜欢的帖子，并把对话慢慢沉淀成自己的社区身份。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {points.map((item) => {
              const Icon = item.icon
              return (
                <Surface key={item.title} className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Surface>
              )
            })}
          </div>
        </section>

        <div className="lg:justify-self-end">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge tone="emerald">secure session</Badge>
            <span className="text-xs text-slate-500">邮箱登录 / 注册</span>
          </div>
          <AuthPanel redirectTo="/content" initialMode={initialMode} />
        </div>
      </div>
    </main>
  )
}
