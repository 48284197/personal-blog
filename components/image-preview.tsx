'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import Image from '@/components/app-image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type PreviewState = {
  galleryId: string
  images: string[]
  index: number
  title: string
}

type ImagePreviewContextValue = {
  openPreview: (state: PreviewState) => void
  closePreview: () => void
}

const ImagePreviewContext = createContext<ImagePreviewContextValue | null>(null)

export function ImagePreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const closePreview = useCallback(() => setPreview(null), [])
  const openPreview = useCallback((state: PreviewState) => setPreview(state), [])

  useEffect(() => {
    if (!preview) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [preview, closePreview])

  const value = useMemo(
    () => ({
      openPreview,
      closePreview,
    }),
    [closePreview, openPreview]
  )

  const currentImage = preview?.images[preview.index]

  const goPrevious = () => {
    if (!preview || preview.images.length <= 1) return
    setPreview((current) => {
      if (!current) return current
      const nextIndex = (current.index - 1 + current.images.length) % current.images.length
      return { ...current, index: nextIndex }
    })
  }

  const goNext = () => {
    if (!preview || preview.images.length <= 1) return
    setPreview((current) => {
      if (!current) return current
      const nextIndex = (current.index + 1) % current.images.length
      return { ...current, index: nextIndex }
    })
  }

  return (
    <ImagePreviewContext.Provider value={value}>
      {children}

      {preview ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/15 px-4 py-6 backdrop-blur-[1.5px]"
          onClick={closePreview}
          role="presentation"
        >
          <button
            type="button"
            onClick={closePreview}
            className="fixed right-4 top-4 z-[100] inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:right-6 sm:top-6"
            aria-label="关闭预览"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <div className="relative flex max-h-[90vh] w-full flex-col items-center justify-center">
              <div className="relative flex min-h-[60vh] w-full flex-1 items-center justify-center">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={preview.title}
                    fill
                    sizes="100vw"
                    unoptimized
                    className="max-h-[90vh] w-auto max-w-full object-contain"
                  />
                ) : null}
              </div>

              {preview.images.length > 1 ? (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-4">
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="上一张"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                    aria-label="下一张"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </ImagePreviewContext.Provider>
  )
}

export function useImagePreview() {
  const context = useContext(ImagePreviewContext)
  if (!context) {
    throw new Error('useImagePreview must be used within ImagePreviewProvider')
  }

  return context
}
