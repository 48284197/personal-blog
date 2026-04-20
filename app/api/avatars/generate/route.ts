import { NextRequest, NextResponse } from 'next/server'
import { generateComicImage } from '@/lib/jimeng'
import { uploadImageToS3 } from '@/lib/upload-service'

/**
 * 生成默认头像 API
 * 为不同风格的用户生成默认头像
 */
export async function POST(request: NextRequest) {
  try {
    const { style = 'abstract', index = 1 } = await request.json()

    const avatarPrompts: Record<string, string> = {
      robot: 'A cute friendly robot avatar, round head with big expressive eyes, soft blue and white color scheme, minimalist 3D style, smooth gradients, centered composition, clean background, high quality digital art, suitable for user profile picture',
      cat: 'A cute cartoon cat avatar, big round eyes, soft pink and purple gradient background, minimalist 3D rendered style, kawaii aesthetic, centered composition, smooth gradients, high quality digital art, suitable for user profile picture',
      panda: 'A cute cartoon panda avatar, black and white with rosy cheeks, soft green bamboo background, minimalist 3D style, kawaii aesthetic, centered composition, smooth gradients, high quality digital art, suitable for user profile picture',
      fox: 'A cute cartoon fox avatar, big ears and fluffy tail, soft orange and cream colors, minimalist 3D rendered style, kawaii aesthetic, centered composition, smooth gradients, high quality digital art, suitable for user profile picture',
      owl: 'A cute wise owl avatar with big round eyes and small beak, soft purple and gold colors, minimalist 3D style, kawaii aesthetic, centered composition, smooth gradients, high quality digital art, suitable for user profile picture',
      dog: 'A cute friendly dog avatar, tongue out happy expression, soft yellow and cream colors, minimalist 3D rendered style, kawaii aesthetic, centered composition, smooth gradients, high quality digital art, suitable for user profile picture',
      abstract: `Abstract geometric avatar ${index}, colorful gradient shapes, modern minimalist design, smooth curves and circles, vibrant colors on soft gradient background, centered composition, high quality digital art, suitable for user profile picture`,
    }

    const prompt = avatarPrompts[style] || avatarPrompts.abstract

    console.log(`Generating avatar: ${style}_${index}`)

    // 生成图片
    const result = await generateComicImage(prompt, {
      model: 'doubao-seedream-4-5-251128',
      ratio: '1:1',
      frames: 1,
    })

    if (!result.success || result.images.length === 0) {
      return NextResponse.json(
        { message: '头像生成失败' },
        { status: 500 }
      )
    }

    const imageUrl = result.images[0].url

    // 上传到 S3
    const s3Url = await uploadImageToS3(imageUrl, `avatar-${style}-${index}.png`)

    console.log(`Avatar generated and uploaded: ${s3Url}`)

    return NextResponse.json({
      success: true,
      url: s3Url,
      style,
      index,
    })
  } catch (error) {
    console.error('生成头像失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '生成头像失败' },
      { status: 500 }
    )
  }
}

/**
 * 批量生成默认头像
 */
export async function GET() {
  const styles = ['robot', 'cat', 'panda', 'fox', 'owl', 'dog']
  const results: Array<{ style: string; url: string }> = []

  try {
    for (const style of styles) {
      const response = await fetch('http://localhost:3000/api/avatars/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, index: 1 }),
      })

      if (response.ok) {
        const data = await response.json()
        results.push({ style, url: data.url })
        console.log(`✅ ${style}: ${data.url}`)
      } else {
        console.error(`❌ ${style}: 生成失败`)
      }

      // 等待 3 秒避免请求过快
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    return NextResponse.json({
      success: true,
      avatars: results,
    })
  } catch (error) {
    console.error('批量生成头像失败:', error)
    return NextResponse.json(
      { message: '批量生成失败', results },
      { status: 500 }
    )
  }
}
