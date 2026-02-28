export interface ComicOptions {
  model?: string
  style?: string
  ratio?: string
  frames?: number
}

export interface ComicImage {
  url: string
  description: string
  frame: number
}

export interface ComicGenerationResponse {
  success: boolean
  images: ComicImage[]
  comicId?: string
}

export async function generateComicImage(prompt: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  try {
    const response = await fetch('https://api.jimeng.com/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.JIMENG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: options.model || 'jimeng-v1.4',
        style: options.style || 'anime',
        ratio: options.ratio || '16:9',
        n: options.frames || 4
      })
    })

    if (!response.ok) {
      throw new Error(`集梦AI API错误: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      images: data.images.map((img: any, index: number) => ({
        url: img.url,
        description: prompt,
        frame: index + 1
      })),
      comicId: data.comicId
    }
  } catch (error) {
    console.error('生成漫画图片错误:', error)
    throw new Error('生成漫画图片失败，请稍后重试')
  }
}

export async function parseStoryToScenes(story: string): Promise<Array<{ frame: number, description: string, prompt: string }>> {
  const scenes = story.split('\n\n').filter(s => s.trim())
  
  return scenes.map((scene, index) => ({
    frame: index + 1,
    description: scene,
    prompt: `漫画风格，${scene}`
  }))
}

export async function generateComicFromStory(story: string, options: ComicOptions = {}): Promise<ComicGenerationResponse> {
  const scenes = await parseStoryToScenes(story)
  const images: ComicImage[] = []
  
  for (const scene of scenes) {
    try {
      const result = await generateComicImage(scene.prompt, {
        ...options,
        frames: 1
      })
      images.push(...result.images)
    } catch (error) {
      console.error(`生成第${scene.frame}帧失败:`, error)
      throw error
    }
  }
  
  return {
    success: true,
    images
  }
}