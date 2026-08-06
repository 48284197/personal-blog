import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: ({ request, params }) => invokeHandler(POST, request, params),
    },
  },
})

import { AppResponse as NextResponse, type AppRequest as NextRequest, invokeHandler } from '@/lib/http'
import { destroyCurrentSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await destroyCurrentSession(request)
  return NextResponse.json({ success: true })
}
