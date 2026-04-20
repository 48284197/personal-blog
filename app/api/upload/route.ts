import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_FILES = 50 // 单次最多上传50个文件

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://s3.bitiful.net',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

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
      const buffer = Buffer.from(bytes)
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 15)
      const key = `uploads/${timestamp}-${random}-${file.name}`

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      )

      uploadedFiles.push({
        url: `${domain}/${key}`,
        name: file.name,
        type: file.type,
        size: file.size,
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: '上传失败，请稍后重试' }, { status: 500 })
  }
}
