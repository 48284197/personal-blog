'use client'

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, Loader2, X, AlertCircle } from 'lucide-react'
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

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
    setUploadProgress({})

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
      setUploadProgress({})
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
          'rounded-2xl border border-dashed px-4 py-4 transition',
          isDragActive
            ? 'border-cyan-300 bg-cyan-50'
            : 'border-slate-200 bg-white hover:bg-slate-50'
        )}
      >
        <input {...getInputProps()} />
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
          <div className="text-sm text-slate-500">
            {helperText ?? '拖拽文件到这里，或者点击选择文件'}
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className={cn('grid gap-3', previewMode === 'image' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1')}>
          {files.map((file, index) => (
            <div
              key={file + index}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50',
                previewMode === 'image' ? 'aspect-square' : 'px-4 py-3'
              )}
            >
              {previewMode === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file} alt="upload preview" className="h-full w-full object-cover" />
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
