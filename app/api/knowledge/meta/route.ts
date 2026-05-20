import { NextResponse } from 'next/server'
import { getKnowledgeCreateMeta } from '@/lib/knowledge-service'

export async function GET() {
  try {
    return NextResponse.json(getKnowledgeCreateMeta())
  } catch {
    return NextResponse.json(
      { message: '获取知识创建元数据失败' },
      { status: 500 }
    )
  }
}
