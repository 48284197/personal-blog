import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const generation = await prisma.aiGeneration.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!generation) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error('Get AI generation error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, aiTool, prompt, inputParams, output, tags = [] } = body

    const generation = await prisma.aiGeneration.update({
      where: { id: parseInt(id) },
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
    console.error('Update AI generation error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.aiGeneration.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete AI generation error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
