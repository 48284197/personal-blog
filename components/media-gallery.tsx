'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { useImagePreview } from '@/components/image-preview'
import { cn } from '@/lib/utils'

type MediaGalleryProps = {
  images: string[]
  title: string
  galleryId: string
}

export function MediaGallery({ images, title, galleryId }: MediaGalleryProps) {
  const visibleImages = images.slice(0, 9)
  const count = visibleImages.length

  if (count === 0) {
    return (
      <div className="px-5 pb-2 sm:px-6">
        <MediaPlaceholder />
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className="px-4 pb-2 sm:px-5">
        <div className="w-fit max-w-[min(100%,280px)]">
          <PreviewableImage
            src={visibleImages[0]}
            alt={title}
            images={visibleImages}
            galleryId={galleryId}
            title={title}
            index={0}
            className="w-auto max-w-full"
            imageClassName="h-auto max-h-[60vh] w-auto max-w-full object-contain"
          />
        </div>
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="px-4 pb-2 sm:px-5">
        <div className="grid w-[min(100%,320px)] grid-cols-2 gap-1.5">
          {visibleImages.map((image, index) => (
            <PreviewableImage
              key={image + index}
              src={image}
              alt={title}
              images={visibleImages}
              galleryId={galleryId}
              title={title}
              index={index}
              className="aspect-square"
              imageClassName="h-full w-full object-cover"
            />
          ))}
        </div>
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="px-4 pb-2 sm:px-5">
        <div className="grid w-[min(100%,360px)] grid-cols-3 gap-1.5">
          {visibleImages.map((image, index) => (
            <PreviewableImage
              key={image + index}
              src={image}
              alt={title}
              images={visibleImages}
              galleryId={galleryId}
              title={title}
              index={index}
              className="aspect-square"
              imageClassName="h-full w-full object-cover"
            />
          ))}
        </div>
      </div>
    )
  }

  if (count === 4) {
    return (
      <div className="px-4 pb-2 sm:px-5">
        <div className="grid w-[min(100%,400px)] grid-cols-2 gap-1.5">
          {visibleImages.map((image, index) => (
            <PreviewableImage
              key={image + index}
              src={image}
              alt={title}
              images={visibleImages}
              galleryId={galleryId}
              title={title}
              index={index}
              className="aspect-square"
              imageClassName="h-full w-full object-cover"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-2 sm:px-5">
      <div className="grid w-[min(100%,360px)] grid-cols-3 gap-1.5">
        {visibleImages.map((image, index) => (
          <PreviewableImage
            key={image + index}
            src={image}
            alt={title}
            images={visibleImages}
            galleryId={galleryId}
            title={title}
            index={index}
            className="aspect-square"
            imageClassName="h-full w-full object-cover"
          />
        ))}
      </div>
    </div>
  )
}

function PreviewableImage({
  src,
  alt,
  images,
  galleryId,
  title,
  index,
  className,
  imageClassName,
}: {
  src: string
  alt: string
  images: string[]
  galleryId: string
  title: string
  index: number
  className?: string
  imageClassName?: string
}) {
  const { openPreview } = useImagePreview()
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={() =>
        openPreview({
          galleryId,
          images,
          index,
          title,
        })
      }
      className={cn(
        'group relative block w-full overflow-hidden rounded-[18px] bg-slate-100 text-left',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 transition-opacity duration-300',
          loaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      <Image
        src={src}
        alt={alt}
        width={960}
        height={960}
        unoptimized
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          'relative z-10 block transition duration-300 group-hover:scale-[1.01]',
          imageClassName ?? 'h-full w-full object-cover',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div className="pointer-events-none absolute inset-0 border border-white/60 opacity-0 transition group-hover:opacity-100" />
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-950/55 px-2 py-1 text-[10px] text-white/90 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
        预览
      </div>
    </button>
  )
}

function MediaPlaceholder() {
  return (
    <div className="flex min-h-[220px] w-full items-center justify-center rounded-[18px] bg-slate-100">
      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-500 shadow-sm">
        <ImageIcon className="h-4 w-4" />
        图片加载中
      </div>
    </div>
  )
}
