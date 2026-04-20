import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { knowledgeSeeds } from '@/lib/site-data'

export async function GET() {
  try {
    const knowledge = await prisma.knowledgeItem.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      knowledge: knowledge.map((item) => ({
        title: item.title,
        category: item.category,
        summary: item.summary,
      })),
    })
  } catch {
    return NextResponse.json({ knowledge: knowledgeSeeds })
  }
}
