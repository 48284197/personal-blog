import { NextRequest, NextResponse } from 'next/server'
import { destroyCurrentSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await destroyCurrentSession(request)
  return NextResponse.json({ success: true })
}
