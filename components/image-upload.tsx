'use client'

import { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  multiple?: boolean
  maxFiles?: number
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
  className?: string
  value?: string[]
  onChange?: (urls: string[]) => void
}

export function ImageUpload({
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  onUploadComplete,
  onUploadError,
  className,
  value = [],
  onChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>(value)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const uploadToServer = useCallback(async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('上传失败')
    const { url } = await res.json()
    return url
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const remainingSlots = maxFiles - previewUrls.length
    if (remainingSlots <= 0) {
      onUploadError?.('已达到最大上传数量')
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    setUploading(true)

    try {
      const uploadedUrls = await Promise.all(filesToUpload.map(uploadToServer))
      const newUrls = multiple ? [...previewUrls, ...uploadedUrls] : uploadedUrls
      setPreviewUrls(newUrls)
      onChange?.(newUrls)
      onUploadComplete?.(uploadedUrls)
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }, [maxFiles, multiple, onUploadComplete, onUploadError, onChange, previewUrls, uploadToServer])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: multiple ? maxFiles : 1,
    multiple,
    onDrop: handleFiles,
    disabled: uploading || previewUrls.length >= maxFiles,
  })

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      e.preventDefault()
      handleFiles(files)
    }
  }, [handleFiles])

  const removeImage = useCallback((index: number) => {
    const newUrls = previewUrls.filter((_, i) => i !== index)
    setPreviewUrls(newUrls)
    onChange?.(newUrls)
  }, [onChange, previewUrls])

  return (
    <div ref={pasteAreaRef} className={cn('space-y-3', className)} onPaste={handlePaste}>
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`图片 ${index + 1}`}
                className="w-full h-full object-cover border border-slate-800"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewUrls.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'border border-dashed p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-cyan-500/60 bg-cyan-500/5'
              : 'border-slate-700 hover:border-slate-600',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500/60" />
              <p className="text-xs font-mono text-slate-600">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-700" />
              <p className="text-xs font-mono text-slate-600">
                {isDragActive ? '释放以上传' : '拖拽或点击上传'}
              </p>
              <p className="text-xs font-mono text-slate-700">支持 Ctrl+V 粘贴 · 最多 {maxFiles} 张</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
