import { NextRequest, NextResponse } from 'next/server'

/**
 * 使用 DeepSeek 将歌词转换为图片生成提示词
 * 避免歌词中的文字标签被渲染到图片上
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, theme, lyrics, genre, mood } = body as {
      title?: string
      theme?: string
      lyrics?: string
      genre?: string
      mood?: string
    }

    if (!lyrics || !title) {
      return NextResponse.json(
        { message: '缺少必要参数：title 或 lyrics' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: '缺少 DeepSeek API Key' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
    const model = process.env.DEEPSEEK_IMAGE_PROMPT_MODEL?.trim() || 'deepseek-chat'

    // 清理歌词，移除标签
    const cleanLyrics = lyrics
      .replace(/\[Verse \d*\]|\[Chorus\]|\[Bridge\]|\[Outro\]|\[Pre-Chorus\]|\[Hook\]/gi, '')
      .trim()

    const messages = [
      {
        role: 'system',
        content: `你是一位专业的 AI 绘画提示词工程师，擅长将音乐和歌词转化为视觉描述。

【任务】
将用户提供的歌曲信息转换为适合 AI 图片生成的英文提示词。

【要求】
1. 只输出视觉描述，不要包含任何文字、字母、符号
2. 描述画面构图、色彩、氛围、光影
3. 使用英文输出
4. 提示词长度控制在 200-500 个字符
5. 适合专辑封面风格，正方形构图

【禁止】
- 不要包含歌词中的文字内容
- 不要生成带有文字或水印的描述
- 不要使用 "text", "word", "letter", "typography" 等词汇`,
      },
      {
        role: 'user',
        content: `请为以下歌曲生成 AI 绘画提示词：

【歌曲标题】
${title}

【主题】
${theme || '未指定'}

【曲风】
${genre || '未指定'}

【情绪】
${mood || '未指定'}

【歌词内容】
${cleanLyrics.slice(0, 500)}

请直接输出英文提示词，不要有任何解释：`,
      },
    ]

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { message: `DeepSeek 接口调用失败：${response.status} ${errorText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const prompt = data.choices?.[0]?.message?.content?.trim()

    if (!prompt) {
      return NextResponse.json(
        { message: 'DeepSeek 未返回有效提示词' },
        { status: 500 }
      )
    }

    // 后处理：确保没有文字相关的词汇
    const cleanedPrompt = prompt
      .replace(/\b(text|word|letter|typography|font|write|writing|signature|watermark)\b/gi, '')
      .replace(/"[^"]*"/g, '') // 移除引号内的内容
      .replace(/\s+/g, ' ')
      .trim()

    return NextResponse.json({
      prompt: cleanedPrompt,
      originalPrompt: prompt,
    })
  } catch (error) {
    console.error('生成图片提示词失败:', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '生成图片提示词失败',
      },
      { status: 500 }
    )
  }
}
