import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Sparkles, Calendar, Hash, Terminal, MessageSquare, Cpu, Copy, Check } from 'lucide-react'
import dayjs from 'dayjs'
import { CopyButton } from '@/components/copy-button'

interface AiGeneration {
  id: number
  title: string
  aiTool: string
  prompt: string
  inputParams: string | null
  output: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

async function getAiGeneration(id: string): Promise<AiGeneration | null> {
  const generation = await prisma.aiGeneration.findFirst({
    where: { id: parseInt(id), deletedAt: null },
  })
  return generation
}

export default async function AiGenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const generation = await getAiGeneration(id)

  if (!generation) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-lg border-b border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/ai-generations" className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                返回列表
              </Link>
            </div>
            <span className="text-xs font-mono text-purple-400 tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI 产物详情
            </span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h1 className="text-xl font-mono font-bold text-slate-200">
                {generation.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-500/60" />
                {generation.aiTool}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {dayjs(generation.createdAt).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
          </div>

          {/* Tags */}
          {generation.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-8 pb-6 border-b border-slate-800">
              <Hash className="w-3.5 h-3.5 text-slate-600" />
              {generation.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {/* Prompt Section */}
            <section className="bg-[#0e0e1a] border border-slate-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500/70" />
                  <span className="text-xs font-mono text-slate-400 tracking-wider">提示词 (Prompt)</span>
                </div>
                <CopyButton text={generation.prompt} />
              </div>
              <div className="p-4">
                <div
                  className="text-sm text-slate-300 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: generation.prompt }}
                />
              </div>
            </section>

            {/* Input Params Section */}
            {generation.inputParams && (
              <section className="bg-[#0e0e1a] border border-slate-800">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-500/70" />
                    <span className="text-xs font-mono text-slate-400 tracking-wider">输入参数</span>
                  </div>
                  <CopyButton text={generation.inputParams} />
                </div>
                <div className="p-4">
                  <div
                    className="text-xs text-slate-400 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: generation.inputParams }}
                  />
                </div>
              </section>
            )}

            {/* Output Section */}
            <section className="bg-[#0e0e1a] border border-slate-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500/70" />
                  <span className="text-xs font-mono text-slate-400 tracking-wider">输出结果</span>
                </div>
                <CopyButton text={generation.output} />
              </div>
              <div className="p-4">
                <div
                  className="text-sm text-slate-300 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: generation.output }}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
