import { generateComicImage } from '@/lib/jimeng'
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

    const { prompt, width, height, num_images } = body as {
      prompt?: string
      width?: number
      height?: number
      num_images?: number
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      console.error('缺少 prompt 参数')
      return Response.json({ message: '缺少必要参数：prompt' }, { status: 400 })
    }

    console.log('开始调用火山引擎API生成图片...')
    
    // 使用火山引擎的官方 API
    const result = await generateComicImage(prompt.trim(), {
      model: 'doubao-seedream-4-5-251128',
      style: 'general', // 通用风格
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

    // 上传图片到 S3
    console.log('开始上传图片到S3...')
    const uploadedImages = await Promise.all(
      result.images.map(async (img, idx) => {
        try {
          console.log(`上传图片 ${idx}:`, img.url.substring(0, 100))
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
        request_id: result.comicId || `req-${Date.now()}`,
        images: uploadedImages,
      },
    })
  } catch (error) {
    console.error('图片生成API错误:', error)
    const message = error instanceof Error ? error.message : '生图失败'
    return Response.json({ message }, { status: 500 })
  }
}
