import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const generations = await prisma.aiGeneration.findMany({
      where: { deletedAt: null },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(generations)
  } catch (error) {
    console.error('Get AI generations error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, aiTool, prompt, inputParams, output, tags = [] } = body

    const generation = await prisma.aiGeneration.create({
      data: {
        title,
        aiTool,
        prompt,
        inputParams: inputParams || null,
        output,
        tags: tags.filter(Boolean),
      },
    })

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Create AI generation error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
