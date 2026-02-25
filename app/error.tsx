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
    <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
      {/* Pixel grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      {/* Top radial glow — red tinted for error state */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(239,68,68,0.05),transparent)] pointer-events-none" />
      {/* Bottom-right secondary glow */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent)] pointer-events-none" />

      <main className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="max-w-lg w-full mx-auto px-4 sm:px-6 text-center">

          {/* Error badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 border border-red-500/30 bg-red-500/5 text-xs text-red-400 font-mono tracking-widest">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            系统故障 · INTERNAL_SERVER_ERROR
          </div>

          {/* Large 500 */}
          <div className="relative mb-8 select-none">
            <div className="text-[8rem] sm:text-[12rem] font-bold font-mono leading-none text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-purple-400">
              500
            </div>
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.06)_3px,rgba(0,0,0,0.06)_4px)] pointer-events-none" />
          </div>

          {/* Terminal error box */}
          <div className="border border-slate-800 bg-[#0e0e1a] px-8 py-6 relative mb-8 text-left">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-red-500/50" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-red-500/50" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/50" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/50" />

            <div className="font-mono text-sm space-y-2.5">
              <p className="text-slate-600">
                <span className="text-red-500">!</span> 服务器遇到未预期的错误
              </p>
              {error.digest && (
                <p className="text-slate-600">
                  <span className="text-slate-700">DIGEST: </span>
                  <span className="text-slate-500">{error.digest}</span>
                </p>
              )}
              <p className="text-slate-400">
                <span className="text-cyan-500">&gt;</span> 请尝试刷新页面或稍后重试
                <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 align-middle animate-pulse" />
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all duration-200 cursor-pointer"
            >
              ↺ 重试
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-mono border border-slate-800 text-slate-500 hover:border-cyan-500/40 hover:text-cyan-400 transition-all duration-200"
            >
              ← 返回首页
            </Link>
          </div>

          {/* Footer status line */}
          <div className="mt-12 text-xs font-mono text-slate-700 flex items-center justify-center gap-4">
            <span>ERR_CODE: 0x500</span>
            <span>·</span>
            <span>STATUS: SERVER_ERROR</span>
            <span>·</span>
            <span className="text-red-900">SYS: FAULT</span>
          </div>

        </div>
      </main>
    </div>
  )
}
