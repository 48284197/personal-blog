import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
    },
  },
})

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_FILES = 50 // 单次最多上传50个文件
const TINIFY_API_KEY = process.env.TINIFY_API_KEY || '6CLdBrbCX0TSRDHbGJ2dHqcKGGmcthck'
const TINIFY_SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'application/pdf': 'pdf',
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://s3.bitiful.net',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

async function compressImageWithTinify(buffer: Buffer, contentType: string) {
  if (!TINIFY_SUPPORTED_TYPES.has(contentType)) return buffer

  try {
    const auth = Buffer.from(`api:${TINIFY_API_KEY}`).toString('base64')
    const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': contentType,
      },
      body: new Uint8Array(buffer),
    })

    if (!shrinkResponse.ok) {
      const detail = await shrinkResponse.text().catch(() => '')
      console.warn('Tinify compression skipped:', shrinkResponse.status, detail)
      return buffer
    }

    const compressedUrl = shrinkResponse.headers.get('location')
    if (!compressedUrl) return buffer

    const compressedResponse = await fetch(compressedUrl, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!compressedResponse.ok) {
      const detail = await compressedResponse.text().catch(() => '')
      console.warn('Tinify download skipped:', compressedResponse.status, detail)
      return buffer
    }

    const compressed = Buffer.from(await compressedResponse.arrayBuffer())
    return compressed.length > 0 && compressed.length < buffer.length ? compressed : buffer
  } catch (error) {
    console.warn('Tinify compression skipped:', error)
    return buffer
  }
}

function getSafeExtension(file: File) {
  const typedExtension = EXTENSION_BY_TYPE[file.type]
  if (typedExtension) return typedExtension

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  return extension?.slice(0, 12) || 'bin'
}

function createSafeObjectKey(file: File) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `uploads/${timestamp}-${random}.${getSafeExtension(file)}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const entries = formData.getAll('files')
    const files = entries.filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ message: '没有文件上传' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ message: `最多只能上传 ${MAX_FILES} 个文件` }, { status: 400 })
    }

    // 验证文件大小
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `文件 ${file.name} 超过大小限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
          { status: 400 }
        )
      }
    }

    const uploadedFiles = []
    const bucket = process.env.AWS_S3_BUCKET || 'xuxiweii'
    const domain = process.env.AWS_S3_DOMAIN || `https://${bucket}.s3.bitiful.net`

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const originalBuffer = Buffer.from(bytes)
      const buffer = await compressImageWithTinify(originalBuffer, file.type)
      const key = createSafeObjectKey(file)

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      )

      uploadedFiles.push({
        url: `${domain}/${key.split('/').map(encodeURIComponent).join('/')}`,
        name: file.name,
        type: file.type,
        size: buffer.length,
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: '上传失败，请稍后重试' }, { status: 500 })
  }
}
