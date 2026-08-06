import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, invokeHandler } from '@/lib/http'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'carbon-silicon-interaction',
    timestamp: new Date().toISOString(),
  })
}
