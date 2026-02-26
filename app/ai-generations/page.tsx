import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Sparkles, Calendar, Hash } from 'lucide-react'
import dayjs from 'dayjs'

interface AiGeneration {
  id: number
  title: string
  aiTool: string
  prompt: string
  output: string
  tags: string[]
  createdAt: Date
}

export const revalidate = 60

async function getAiGenerations(): Promise<AiGeneration[]> {
  const generations = await prisma.aiGeneration.findMany({
    where: { deletedAt: null },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return generations
}

export default async function AiGenerationsPage() {
  const generations = await getAiGenerations()

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
                返回首页
              </Link>
            </div>
            <span className="text-xs font-mono text-purple-400 tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI 产物
            </span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-mono font-bold text-slate-200 mb-2">
              <span className="text-purple-500">~</span> AI 产物收藏
            </h1>
            <p className="text-sm font-mono text-slate-500">
              收集使用 AI 生成的有趣内容，包括提示词、参数和输出结果
            </p>
          </div>

          {/* Generations Grid */}
          {generations.length === 0 ? (
            <div className="text-center py-24 border border-slate-800">
              <Sparkles className="w-8 h-8 mx-auto text-slate-700 mb-3" />
              <p className="text-xs font-mono text-slate-600">
                <span className="text-purple-500">~</span> 暂无 AI 产物
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {generations.map((gen, idx) => (
                <Link
                  key={gen.id}
                  href={`/ai-generations/${gen.id}`}
                  className="group block bg-[#0e0e1a] border border-slate-800 hover:border-purple-500/30 transition-all p-5 relative"
                >
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 group-hover:border-purple-500/40 transition-colors" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 group-hover:border-purple-500/40 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700 group-hover:border-purple-500/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700 group-hover:border-purple-500/40 transition-colors" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-slate-700">
                          [{String(idx + 1).padStart(2, '0')}]
                        </span>
                        <h2 className="text-sm font-mono text-slate-200 group-hover:text-purple-400 transition-colors truncate">
                          {gen.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-slate-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-purple-500/60" />
                          {gen.aiTool}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {dayjs(gen.createdAt).format('YYYY-MM-DD')}
                        </span>
                      </div>

                      {/* Preview of prompt */}
                      <p className="text-xs font-mono text-slate-500 line-clamp-2 mb-3">
                        <span className="text-slate-700">提示词:</span>{' '}
                        {gen.prompt.slice(0, 120)}{gen.prompt.length > 120 ? '...' : ''}
                      </p>

                      {/* Tags */}
                      {gen.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Hash className="w-3 h-3 text-slate-700" />
                          {gen.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-mono text-purple-500/60"
                            >
                              #{tag}
                            </span>
                          ))}
                          {gen.tags.length > 4 && (
                            <span className="text-xs font-mono text-slate-700">
                              +{gen.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-mono text-slate-600 group-hover:text-purple-400 transition-colors">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
