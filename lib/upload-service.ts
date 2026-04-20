import { s3Client } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'xuxiweii'
const DOMAIN = process.env.AWS_S3_DOMAIN || 'https://xuxiweii.s3.bitiful.net'

/**
 * 上传音频文件到 S3
 */
export async function uploadAudioToS3(
  audioData: Buffer | string,
  fileName: string
): Promise<string> {
  try {
    // 如果是 data URL，转换为 Buffer
    let buffer: Buffer
    if (typeof audioData === 'string') {
      if (audioData.startsWith('data:')) {
        const base64Data = audioData.split(',')[1]
        buffer = Buffer.from(base64Data, 'base64')
      } else {
        buffer = Buffer.from(audioData)
      }
    } else {
      buffer = audioData
    }

    const key = `music/${Date.now()}-${fileName}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'audio/mpeg',
      })
    )

    return `${DOMAIN}/${key}`
  } catch (error) {
    console.error('Failed to upload audio to S3:', error)
    throw new Error('音频上传失败')
  }
}

/**
 * 上传图片文件到 S3
 */
export async function uploadImageToS3(
  imageData: Buffer | string,
  fileName: string
): Promise<string> {
  try {
    // 如果是 data URL，转换为 Buffer
    let buffer: Buffer
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        const base64Data = imageData.split(',')[1]
        buffer = Buffer.from(base64Data, 'base64')
      } else {
        buffer = Buffer.from(imageData)
      }
    } else {
      buffer = imageData
    }

    const key = `images/${Date.now()}-${fileName}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      })
    )

    return `${DOMAIN}/${key}`
  } catch (error) {
    console.error('Failed to upload image to S3:', error)
    throw new Error('图片上传失败')
  }
}

/**
 * 从 URL 下载文件并上传到 S3
 */
export async function uploadFromUrlToS3(
  url: string,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`)
    }

    const buffer = await response.arrayBuffer()
    const key = `uploads/${Date.now()}-${fileName}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
      })
    )

    return `${DOMAIN}/${key}`
  } catch (error) {
    console.error('Failed to upload from URL to S3:', error)
    throw new Error('文件上传失败')
  }
}
