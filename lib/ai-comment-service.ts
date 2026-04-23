import { prisma } from '@/lib/prisma'

type AiAccount = {
  id: string
  name: string
  aiPrompt: string | null
  aiCommentDelay: number
  aiActive: boolean
}

type CommentData = {
  publicationId: string
  contentTitle: string
  contentSummary?: string
  authorName: string
}

const DEFAULT_COMMENTS: Record<string, string[]> = {
  default: [
    '太棒了！继续加油 💪',
    '这个作品很有创意！',
    '学习到了，感谢分享',
    '写得真好，支持一下！',
    '期待更多作品 ✨',
  ],
  appreciation: [
    '太棒了，看得出来很用心！',
    '这内容质量很高呀！',
    '被种草了，马上去看看',
    '真不错，点赞支持！',
  ],
  encouragement: [
    '第一次尝试就做得这么好？',
    '潜力无限，继续创作！',
    '加油，期待你的下一部作品',
    '这个风格很喜欢，期待更多',
  ],
}

function getRandomComment(category: string = 'default'): string {
  const comments = DEFAULT_COMMENTS[category] || DEFAULT_COMMENTS.default
  return comments[Math.floor(Math.random() * comments.length)]
}

export async function generateAiComment(
  aiAccount: AiAccount,
  commentData: CommentData
): Promise<string> {
  if (!aiAccount.aiPrompt) {
    return getRandomComment('default')
  }

  const prompt = `${aiAccount.aiPrompt}

内容信息：
- 标题：${commentData.contentTitle}
- 作者：${commentData.authorName}
${commentData.contentSummary ? `- 简介：${commentData.contentSummary}` : ''}

请根据以上信息，生成一条简短的评论（不超过50字）。`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status)
      return getRandomComment('default')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || getRandomComment('default')
  } catch (error) {
    console.error('Failed to call DeepSeek API:', error)
    return getRandomComment('default')
  }
}

export async function triggerAiComments(publicationId: string) {
  try {
    const publication = await prisma.publication.findUnique({
      where: { id: publicationId },
      select: {
        id: true,
        title: true,
        summary: true,
        authorId: true,
      },
    })

    if (!publication) {
      console.error('Publication not found:', publicationId)
      return
    }

    const aiAccounts = await prisma.user.findMany({
      where: {
        role: 'AI_COMMENTATOR',
        aiActive: true,
      },
      select: {
        id: true,
        name: true,
        aiPrompt: true,
        aiCommentDelay: true,
        aiActive: true,
      },
    })

    if (aiAccounts.length === 0) {
      console.log('No active AI accounts found')
      return
    }

    for (const aiAccount of aiAccounts) {
      setTimeout(async () => {
        try {
          const commentText = await generateAiComment(aiAccount, {
            publicationId: publication.id,
            contentTitle: publication.title,
            contentSummary: publication.summary || undefined,
            authorName: '用户',
          })

          await prisma.publicationComment.create({
            data: {
              content: commentText,
              authorName: aiAccount.name,
              avatar: 'https://xuxiweii.s3.bitiful.net/uploads/1776699433969-generated-1776699433574-0.jpeg',
              publicationId: publication.id,
            },
          })

          await prisma.publication.update({
            where: { id: publication.id },
            data: { comments: { increment: 1 } },
          })

          console.log(`AI comment created by ${aiAccount.name}: ${commentText}`)
        } catch (error) {
          console.error(`Failed to create comment for ${aiAccount.name}:`, error)
        }
      }, aiAccount.aiCommentDelay)
    }
  } catch (error) {
    console.error('Failed to trigger AI comments:', error)
  }
}