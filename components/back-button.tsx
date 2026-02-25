'use client'

import { useRouter } from 'next/navigation'

export function BackButton({ label = '返回上一页', className }: { label?: string; className?: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.back()} className={className}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  )
}
