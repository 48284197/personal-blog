import { NextResponse } from 'next/server'
import { apiRoutes, backendLayers, prismaEntities } from '@/lib/site-data'

export async function GET() {
  return NextResponse.json({
    prismaEntities,
    backendLayers,
    apiRoutes,
  })
}
