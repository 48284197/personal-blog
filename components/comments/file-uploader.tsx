'use client'

import { useMemo, useState } from 'react'
import Image from '@/components/app-image'
import { useDropzone } from 'react-dropzone'
import { AlertCircle, FileUp, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadedFile = {
  url: string
  name: string
  type: string
  size: number
}

type FileUploaderProps = {
  accept: string
  multiple?: boolean
  value: string[]
  onChange: (urls: string[]) => void
  buttonLabel?: string
  helperText?: string
  previewMode?: 'image' | 'chip'
  className?: string
  maxSize?: number // 单位：字节，默认 50MB
  maxFiles?: number // 最多上传文件数，默认不限制
}

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function FileUploader({
  accept,
  multiple = false,
  value,
  onChange,
  buttonLabel = '选择文件',
  helperText,
  previewMode = 'image',
  className,
  maxSize = 50 * 1024 * 1024, // 默认 50MB
  maxFiles,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const files = useMemo(() => value.filter(Boolean), [value])

  // 验证文件
  const validateFiles = (selectedFiles: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = []
    const valid: File[] = []

    // 检查文件数量
    if (maxFiles && files.length + selectedFiles.length > maxFiles) {
      errors.push(`最多只能上传 ${maxFiles} 个文件`)
      return { valid: [], errors }
    }

    for (const file of selectedFiles) {
      // 检查文件大小
      if (file.size > maxSize) {
        errors.push(`${file.name} 超过大小限制 (${formatFileSize(maxSize)})`)
        continue
      }

      // 检查文件类型
      const acceptTypes = accept.split(',').map((t) => t.trim())
      const isAccepted = acceptTypes.some((type) => {
        if (type.endsWith('/*')) {
          const [mainType] = type.split('/')
          return file.type.startsWith(mainType)
        }
        return file.type === type
      })

      if (!isAccepted) {
        errors.push(`${file.name} 文件类型不支持`)
        continue
      }

      valid.push(file)
    }

    return { valid, errors }
  }

  const uploadFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return

    const { valid, errors } = validateFiles(selectedFiles)

    if (errors.length > 0) {
      setError(errors.join('; '))
      return
    }

    if (valid.length === 0) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      valid.forEach((file) => formData.append('files', file))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message ?? '上传失败')
      }

      const data = (await response.json()) as { files?: UploadedFile[] }
      const urls = data.files?.map((file) => file.url).filter(Boolean) ?? []

      if (urls.length > 0) {
        onChange(multiple ? [...files, ...urls] : [urls[0]])
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { [accept]: [] },
    multiple,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      void uploadFiles(acceptedFiles)
    },
  })

  const removeFile = (index: number) => {
    onChange(files.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden rounded-[28px] border border-dashed transition',
          previewMode === 'image'
            ? 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)]'
            : 'border-slate-200 bg-white px-4 py-4',
          isDragActive
            ? 'border-cyan-300 bg-cyan-50/70'
            : 'hover:border-cyan-200 hover:bg-cyan-50/40'
        )}
      >
        <input {...getInputProps()} />
        {previewMode === 'image' ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-white/70 bg-white/70 px-6 py-10 text-center backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]">
              <ImageIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">上传图片</p>
              <p className="text-sm text-slate-500">
                {isDragActive ? '松开即可上传' : '拖拽或点击选择图片'}
              </p>
            </div>
            <button
              type="button"
              onClick={open}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? '上传中' : buttonLabel}
            </button>
            {helperText ? <div className="text-sm text-slate-500">{helperText}</div> : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={open}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {uploading ? '上传中...' : buttonLabel}
            </button>
            {helperText ? <div className="text-sm text-slate-500">{helperText}</div> : null}
          </div>
        )}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className={cn('grid gap-3', previewMode === 'image' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {files.map((file, index) => (
            <div
              key={file + index}
              className={cn(
                'group relative overflow-hidden border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
                previewMode === 'image' ? 'aspect-square rounded-[24px]' : 'rounded-2xl px-4 py-3'
              )}
            >
              {previewMode === 'image' ? (
                <>
                  <Image src={file} alt="upload preview" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent p-3">
                    <p className="truncate text-[11px] text-white/90">{file.split('/').pop()}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{file.split('/').pop()}</p>
                    <p className="mt-1 text-xs text-slate-500">上传完成</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">已上传</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                aria-label="移除文件"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
