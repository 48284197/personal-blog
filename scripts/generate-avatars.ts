/**
 * 生成默认头像脚本
 * 使用 AI 生成 6 张不同风格的默认头像
 */

const AVATAR_PROMPTS = [
  {
    id: 'default-1',
    prompt: 'A cute cartoon avatar of a friendly robot with round eyes, soft blue gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
  {
    id: 'default-2',
    prompt: 'A cute cartoon avatar of a sleepy cat with big eyes, soft pink and purple gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
  {
    id: 'default-3',
    prompt: 'A cute cartoon avatar of a happy panda with bamboo, soft green gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
  {
    id: 'default-4',
    prompt: 'A cute cartoon avatar of a curious fox with big ears, soft orange gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
  {
    id: 'default-5',
    prompt: 'A cute cartoon avatar of a wise owl with glasses, soft purple gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
  {
    id: 'default-6',
    prompt: 'A cute cartoon avatar of a friendly dog with tongue out, soft yellow gradient background, minimalist design, smooth gradients, 3D rendered style, kawaii aesthetic, centered composition, high quality',
    style: 'digital art',
  },
]

async function generateAvatars() {
  console.log('开始生成默认头像...\n')

  for (const avatar of AVATAR_PROMPTS) {
    try {
      console.log(`生成头像: ${avatar.id}`)
      console.log(`提示词: ${avatar.prompt.substring(0, 80)}...`)

      // 调用图片生成 API
      const response = await fetch('http://localhost:3000/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: avatar.prompt,
          width: 512,
          height: 512,
          num_images: 1,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`生成 ${avatar.id} 失败:`, error.message)
        continue
      }

      const data = await response.json()
      const imageUrl = data.result?.images?.[0]?.url

      if (imageUrl) {
        console.log(`✅ ${avatar.id} 生成成功:`)
        console.log(`   URL: ${imageUrl}\n`)
      } else {
        console.error(`❌ ${avatar.id} 未返回图片 URL\n`)
      }

      // 等待 2 秒避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`生成 ${avatar.id} 出错:`, error)
    }
  }

  console.log('\n头像生成完成！')
  console.log('请将生成的图片 URL 更新到 DEFAULT_AVATARS 数组中')
}

// 运行生成
generateAvatars().catch(console.error)
