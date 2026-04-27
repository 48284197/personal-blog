import { generateComicImage } from '@/lib/jimeng'
import { generateImageWithGrsai } from '@/lib/grsai-image-service'
import { uploadImageToS3 } from '@/lib/upload-service'

export async function GET() {
  return Response.json({
    message: 'Image generation API is running',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('图片生成请求体:', body)

    const { prompt, width, height, num_images, provider, imageUrls } = body as {
      prompt?: string
      width?: number
      height?: number
      num_images?: number
      provider?: string
      imageUrls?: string[]
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      console.error('缺少 prompt 参数')
      return Response.json({ message: '缺少必要参数：prompt' }, { status: 400 })
    }

    const activeProvider = resolveProvider(provider)
    console.log(`开始调用图片生成服务: ${activeProvider}`)

    let requestId = `req-${Date.now()}`
    let generatedImages: Array<{ url: string; base64?: string }> = []

    if (activeProvider === 'grsai') {
      const result = await generateImageWithGrsai({
        prompt: prompt.trim(),
        size: parseSize(width, height),
        variants: num_images || 1,
        imageUrls: Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : undefined,
      })
      requestId = result.request_id || requestId
      generatedImages = result.images
      console.log('GrsAI 返回结果:', {
        requestId,
        imagesCount: generatedImages.length,
      })
    } else {
      // 默认使用火山引擎 API
      const result = await generateComicImage(prompt.trim(), {
        model: 'doubao-seedream-4-5-251128',
        style: 'general',
        ratio: width && height ? `${width}:${height}` : '1:1',
        frames: num_images || 1,
      })
      console.log('火山引擎API返回结果:', {
        success: result.success,
        images_count: result.images.length,
      })
      if (!result.success || result.images.length === 0) {
        throw new Error('图片生成失败')
      }
      requestId = result.comicId || requestId
      generatedImages = result.images.map((img) => ({ url: img.url }))
    }

    if (generatedImages.length === 0) {
      throw new Error('图片生成成功但未返回图片')
    }

    // 上传图片到 S3
    console.log('开始上传图片到S3...')
    const uploadedImages = await Promise.all(
      generatedImages.map(async (img, idx) => {
        try {
          console.log(`上传图片 ${idx}:`, img.url)
          const s3Url = await uploadImageToS3(img.url, `generated-${Date.now()}-${idx}.png`)
          console.log(`图片 ${idx} 上传成功:`, s3Url)
          return {
            url: s3Url,
          }
        } catch (e) {
          console.error(`上传图片 ${idx} 失败:`, e)
          // 如果上传失败，返回原始 URL
          return {
            url: img.url,
          }
        }
      })
    )

    console.log('图片生成和上传完成')
    return Response.json({
      result: {
        request_id: requestId,
        images: uploadedImages,
      },
    })
  } catch (error) {
    console.error('图片生成API错误:', error)
    const message = error instanceof Error ? error.message : '生图失败'
    return Response.json({ message }, { status: 500 })
  }
}

function resolveProvider(input?: string): 'volcengine' | 'grsai' {
  const normalized = (input || process.env.IMAGE_GENERATION_PROVIDER || 'volcengine')
    .trim()
    .toLowerCase()
  return normalized === 'grsai' ? 'grsai' : 'volcengine'
}

function parseSize(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '1:1'
  const d = gcd(width, height)
  return `${Math.round(width / d)}:${Math.round(height / d)}`
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.floor(a))
  let y = Math.abs(Math.floor(b))
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x || 1
}
