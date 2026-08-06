import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/knowledge/meta')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, invokeHandler } from '@/lib/http'
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
