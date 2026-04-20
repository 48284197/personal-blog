import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siliconModels } from '@/lib/site-data'

export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      models: models.map((model) => ({
        name: model.name,
        slug: model.slug,
        category: model.category,
        summary: model.description,
        strengths: model.strengths,
        style: model.style,
        useCase: model.promptTemplate ?? model.description,
      })),
    })
  } catch {
    return NextResponse.json({ models: siliconModels })
  }
}
