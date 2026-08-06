import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/api/blueprint')({
  server: {
    handlers: {
      GET: ({ request, params }) => invokeHandler(GET, request, params),
    },
  },
})

import { AppResponse as NextResponse, invokeHandler } from '@/lib/http'
import { apiRoutes, backendLayers, prismaEntities } from '@/lib/site-data'

export async function GET() {
  return NextResponse.json({
    prismaEntities,
    backendLayers,
    apiRoutes,
  })
}
