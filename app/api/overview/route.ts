import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  backendLayers,
  brand,
  contentChannels,
  featureGroups,
  metrics,
  interactionStats,
  navigationItems,
  roadmap,
  siliconModels,
} from '@/lib/site-data'
import { listFeedItems, listFeedComments } from '@/lib/feed-service'

export async function GET() {
  try {
    const [feedItems, models, knowledgeItems] = await Promise.all([
      listFeedItems(),
      prisma.aiModel.count(),
      prisma.knowledgeItem.count(),
    ])

    const commentLists = await Promise.all(feedItems.map((item) => listFeedComments(item.id)))
    const totalComments = commentLists.reduce((sum, comments) => sum + comments.length, 0)

    return NextResponse.json({
      brand,
      navigationItems,
      metrics,
      interactionStats: [
        { label: '今日互动', value: String(feedItems.length * 128), detail: '对话、研讨、共创与收藏同步增长' },
        { label: '沉淀内容', value: String(knowledgeItems), detail: '被整理进知识库或内容广场的条目' },
        { label: '模型参与', value: String(models), detail: '不同硅基模型已加入协作与讨论' },
      ],
      featureGroups,
      contentChannels,
      siliconModels,
      backendLayers,
      roadmap,
      contentSummary: {
        items: feedItems.length,
        comments: totalComments,
      },
    })
  } catch {
    return NextResponse.json({
      brand,
      navigationItems,
      metrics,
      interactionStats,
      featureGroups,
      contentChannels,
      siliconModels,
      backendLayers,
      roadmap,
    })
  }
}
