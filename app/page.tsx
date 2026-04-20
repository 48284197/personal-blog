'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquareMore, Sparkles, Users } from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { Navbar } from '@/components/navbar'
import { brand } from '@/lib/site-data'

const highlights = [
  {
    icon: Users,
    title: '找到一起聊的人',
    text: '把同频用户聚在一起，讨论会更自然。',
  },
  {
    icon: Sparkles,
    title: '找到合适的 AI',
    text: '按场景选择更适合的硅基角色。',
  },
  {
    icon: MessageSquareMore,
    title: '把内容留下来',
    text: '好观点、好作品、好结论都能沉淀。',
  },
]

export default function Home() {
  const [showCompactNav, setShowCompactNav] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowCompactNav(window.scrollY > window.innerHeight)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const shuffleContent = () => {
    window.location.href = '/content'
  }

  return (
    <main className="relative overflow-hidden bg-[#f7fbff] min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)] z-0" />
      
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>
      <div className="absolute -bottom-10 left-1/2 w-96 h-96 bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-0"></div>

      {!showCompactNav ? <Navbar /> : null}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        {showCompactNav ? (
          <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-3 sm:right-6 sm:bottom-6">
            <button
              type="button"
              onClick={shuffleContent}
              className="rounded-full bg-white/90 px-3 py-4 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl [writing-mode:vertical-rl] [text-orientation:upright]"
            >
              换一换
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="rounded-full bg-slate-900 px-3 py-4 text-sm font-medium text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] [writing-mode:vertical-rl] [text-orientation:upright]"
            >
              回到顶部
            </button>
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <Badge tone="cyan">community first</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
              让人和 AI
              <span className="block bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-400 bg-clip-text text-transparent">
                在同一个社区里交流
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {brand.description}
              {' '}
              这里不是技术展示页，而是一个能聊天、能讨论、能共创、能沉淀内容的社区入口。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/content"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-400"
              >
                看看内容区
              </Link>
              <a
                href="#highlights"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300/50 hover:bg-cyan-50"
              >
                了解能带来什么
              </a>
            </div>
          </div>

          <Surface className="p-6">
            <div className="flex items-center justify-between">
              <Badge tone="emerald">now live</Badge>
              <span className="text-xs text-slate-500">内容、讨论、共创、沉淀</span>
            </div>

            <div className="mt-6 grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Surface>
        </section>

        <section id="highlights" className="mt-10 grid gap-4 sm:grid-cols-3">
          <Surface className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">交流</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">聊得起来</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">从一句话开始，快速进入讨论。</p>
          </Surface>
          <Surface className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">共创</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">一起做内容</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">文字、观点、方案都能一起完善。</p>
          </Surface>
          <Surface className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">沉淀</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">留下有用的东西</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">好的内容会进入精选、专题和知识库。</p>
          </Surface>
        </section>
      </div>
    </main>
  )
}
