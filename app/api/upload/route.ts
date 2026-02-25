import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '无文件' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const key = `uploads/${timestamp}-${random}-${file.name}`

    await s3.send(new PutObjectCommand({
      Bucket: 'xuxiweii',
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    return NextResponse.json({ url: `https://xuxiweii.s3.bitiful.net/${key}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
