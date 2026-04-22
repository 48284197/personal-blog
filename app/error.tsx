'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(252,165,165,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)] z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-0"></div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm text-red-600 font-medium">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            服务器错误
          </div>

          <h1 className="mt-8 text-[6rem] sm:text-[9rem] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400">
            500
          </h1>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 max-w-md mx-auto">
            <p className="text-slate-600 text-sm">
              服务器遇到了未预期的错误
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-slate-400 font-mono">
                错误码: {error.digest}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-400 shadow-lg shadow-red-500/20 cursor-pointer"
            >
              重新尝试
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-cyan-300/50 hover:bg-cyan-50"
            >
              返回首页
            </Link>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-6 text-sm text-slate-400">
          <span>ERR: 500</span>
          <span className="text-slate-300">|</span>
          <span>STATUS: SERVER_ERROR</span>
          <span className="text-slate-300">|</span>
          <span className="text-red-600">SYSTEM: FAULT</span>
        </div>
      </div>
    </main>
  )
}