import Link from 'next/link'
import { FileText, Sparkles, ArrowLeft } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080810]/90 backdrop-blur-lg border-b border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              返回博客
            </Link>
            <span className="text-xs font-mono text-cyan-400 tracking-widest">// 管理后台</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-mono font-bold text-slate-200 mb-8">
            <span className="text-cyan-500">&gt;</span> 管理后台
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Posts Management */}
            <Link
              href="/admin/posts"
              className="group p-6 bg-[#0e0e1a] border border-slate-800 hover:border-cyan-500/30 transition-all relative"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 group-hover:border-cyan-500/40 transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 group-hover:border-cyan-500/40 transition-colors" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700 group-hover:border-cyan-500/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700 group-hover:border-cyan-500/40 transition-colors" />

              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-cyan-500" />
                <h2 className="text-sm font-mono font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  文章管理
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-500">
                创建、编辑和发布博客文章
              </p>
            </Link>

            {/* AI Generations Management */}
            <Link
              href="/admin/ai-generations"
              className="group p-6 bg-[#0e0e1a] border border-slate-800 hover:border-purple-500/30 transition-all relative"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700 group-hover:border-purple-500/40 transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700 group-hover:border-purple-500/40 transition-colors" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700 group-hover:border-purple-500/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700 group-hover:border-purple-500/40 transition-colors" />

              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="text-sm font-mono font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                  AI 产物管理
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-500">
                管理 AI 生成的内容、提示词和输出结果
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
