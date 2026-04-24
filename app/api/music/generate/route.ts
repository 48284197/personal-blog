import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateLyricsWithDeepSeekStream, generateMusicWithMiniMaxStream } from '@/lib/music-service-stream'
import { uploadAudioToS3 } from '@/lib/upload-service'

const generateMusicSchema = z.object({
  theme: z.string().min(1, '请输入主题').max(500),
  lyricsOnly: z.boolean().optional(),
  musicOnly: z.boolean().optional(),
  lyrics: z.string().optional(),
  title: z.string().optional(),
})

export async function GET() {
  return NextResponse.json({
    message: 'Music generation API',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = generateMusicSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: '参数不完整',
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const { theme, lyricsOnly, musicOnly, lyrics: providedLyrics, title: providedTitle } = parsed.data

    // 创建流式响应
    const encoder = new TextEncoder()
    let controller: ReadableStreamDefaultController<Uint8Array>

    const stream = new ReadableStream({
      async start(ctrl) {
        controller = ctrl

        try {
          // 发送开始事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: 'start', data: { message: '开始生成' } })}\n\n`)
          )

          let lyrics = providedLyrics || ''
          let title = providedTitle || '创意音乐'

          // Step 1: Generate Lyrics (if not provided or lyricsOnly mode)
          if (!providedLyrics || lyricsOnly) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ event: 'step', data: { step: 'lyrics', status: 'running', message: '正在生成歌词...' } })}\n\n`
              )
            )

            try {
              lyrics = await generateLyricsWithDeepSeekStream(theme, (chunk) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ event: 'lyrics_chunk', data: { chunk } })}\n\n`
                  )
                )
              })

              // 从歌词中提取标题（第一行）
              const firstLine = lyrics.split('\n')[0]
              if (firstLine && firstLine.trim()) {
                title = firstLine.trim().replace(/^#+\s*/, '').replace(/^【|】$/g, '')
              }
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : '歌词生成失败'
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ event: 'step', data: { step: 'lyrics', status: 'error', message: errorMsg } })}\n\n`
                )
              )
              throw e
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ event: 'step', data: { step: 'lyrics', status: 'completed', data: { lyrics, title, prompt: theme } } })}\n\n`
              )
            )

            // 如果只生成歌词，直接返回
            if (lyricsOnly) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ event: 'complete', data: { result: { lyrics, title, prompt: theme } } })}\n\n`)
              )
              controller.close()
              return
            }
          }

          // Step 2: Generate Music (if not lyricsOnly)
          if (!lyricsOnly) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ event: 'step', data: { step: 'music', status: 'running', message: '正在生成音乐...' } })}\n\n`
              )
            )

            const musicResult = await generateMusicWithMiniMaxStream(
              theme,
              lyrics,
              false,
              (chunk) => {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ event: 'music_chunk', data: { chunk } })}\n\n`
                  )
                )
              }
            )

            // 上传音乐到 S3
            let s3AudioUrl = musicResult.audioUrl
            if (musicResult.audioUrl) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ event: 'music_chunk', data: { chunk: '正在上传音乐到云存储...\n' } })}\n\n`
                  )
                )
                
                // 如果是 data URL（hex 转换的），直接上传
                // 如果是 http URL，从 URL 下载后上传
                const uploadUrl = musicResult.audioUrl
                if (uploadUrl.startsWith('http')) {
                  // 从 URL 下载音频文件
                  const audioResponse = await fetch(uploadUrl)
                  if (!audioResponse.ok) {
                    throw new Error(`无法下载音频：${audioResponse.status}`)
                  }
                  const audioBuffer = await audioResponse.arrayBuffer()
                  s3AudioUrl = await uploadAudioToS3(Buffer.from(audioBuffer), `music-${Date.now()}.mp3`)
                } else {
                  // data URL 直接上传
                  s3AudioUrl = await uploadAudioToS3(uploadUrl, `music-${Date.now()}.mp3`)
                }
                
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ event: 'music_chunk', data: { chunk: '音乐上传完成！\n' } })}\n\n`
                  )
                )
              } catch (e) {
                console.error('Failed to upload audio to S3:', e)
                const uploadError = e instanceof Error ? e.message : '上传失败'
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ event: 'music_chunk', data: { chunk: `警告：音乐上传失败 - ${uploadError}\n` } })}\n\n`
                  )
                )
              }
            }

            const result = {
              title,
              prompt: theme,
              lyrics,
              audioUrl: s3AudioUrl,
              traceId: musicResult.traceId,
              model: musicResult.model,
              extraInfo: musicResult.extraInfo,
              warnings: musicResult.warnings,
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ event: 'step', data: { step: 'music', status: 'completed', data: result } })}\n\n`
              )
            )

            // 发送完成事件
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ event: 'complete', data: { result } })}\n\n`)
            )
          }

          controller.close()
        } catch (error) {
          const message = error instanceof Error ? error.message : '生成失败'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: 'error', data: { message } })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : '音乐生成失败',
      },
      { status: 500 }
    )
  }
}
