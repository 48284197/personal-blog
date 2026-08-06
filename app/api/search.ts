import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { searchCommunity } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') ?? ''
    const currentUser = await syncCurrentPlatformUser()
    const result = await searchCommunity(query, currentUser?.id)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '搜索失败' },
      { status: 500 }
    )
  }
}
