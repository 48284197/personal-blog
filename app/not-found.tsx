import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,212,255,0.07),transparent)] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent)] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">

            {/* Error badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 border border-red-500/30 bg-red-500/5 text-xs text-red-400 font-mono tracking-widest">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              系统异常 · PAGE_NOT_FOUND
            </div>

            {/* Large 404 */}
            <div className="relative mb-8 select-none">
              <div className="text-[8rem] sm:text-[12rem] font-bold font-mono leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                404
              </div>
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.06)_3px,rgba(0,0,0,0.06)_4px)] pointer-events-none" />
            </div>

            {/* Terminal error box */}
            <div className="border border-slate-800 bg-[#0e0e1a] px-8 py-6 relative max-w-md w-full mb-8">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/50" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/50" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/50" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/50" />

              <div className="font-mono text-sm space-y-2.5 text-left">
                <p className="text-slate-600">
                  <span className="text-cyan-500">$</span> GET /requested-path
                </p>
                <p>
                  <span className="text-slate-600">HTTP/1.1 </span>
                  <span className="text-red-400">404 Not Found</span>
                </p>
                <p className="text-slate-400">
                  <span className="text-cyan-500">&gt;</span> 你访问的页面不存在或已被移除
                  <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 align-middle animate-pulse" />
                </p>
              </div>
            </div>

            {/* Action links */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-200"
              >
                ← 返回首页
              </Link>
              <Link
                href="/posts"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono border border-slate-800 text-slate-500 hover:border-purple-500/40 hover:text-purple-400 transition-all duration-200"
              >
                浏览文章 →
              </Link>
            </div>

            {/* Footer status line */}
            <div className="mt-12 text-xs font-mono text-slate-700 flex items-center gap-4">
              <span>ERR_CODE: 0x404</span>
              <span>·</span>
              <span>STATUS: PAGE_MISSING</span>
              <span>·</span>
              <span>SYS: ONLINE</span>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
