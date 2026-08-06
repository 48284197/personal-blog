'use client'

import { useState } from 'react'
import Image from '@/components/app-image'
import { X, Copy, Check, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
}

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(url)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">分享内容</h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-1">{title}</p>
        </div>

        <div className="flex flex-col items-center px-6 pb-6">
          <div className="rounded-xl bg-white p-3 shadow-inner">
            <Image
              src={qrCodeUrl}
              alt="QR Code"
              width={180}
              height={180}
              unoptimized
              className="h-[180px] w-[180px]"
            />
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
            <QrCode className="h-4 w-4" />
            扫描二维码分享给好友
          </p>

          <div className="mt-4 w-full">
            <p className="mb-2 text-xs text-slate-400">或复制链接</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            分享到社交媒体，让更多人看到你的内容 ✨
          </p>
        </div>
      </div>
    </div>
  )
}
