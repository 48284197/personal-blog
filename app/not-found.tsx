import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)] z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm text-cyan-700 font-medium">
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
            页面未找到
          </div>

          <h1 className="mt-8 text-[6rem] sm:text-[9rem] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400">
            404
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            抱歉，你访问的页面不存在或已被移除
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              返回首页
            </Link>
            <Link
              href="/content"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-cyan-300/50 hover:bg-cyan-50"
            >
              浏览文章
            </Link>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6 text-sm text-slate-400">
          <span>ERR: 404</span>
          <span className="text-slate-300">|</span>
          <span>STATUS: NOT_FOUND</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600">SYSTEM: ONLINE</span>
        </div>
      </div>
    </main>
  )
}