import { NextResponse } from 'next/server'
import { getSidebarData } from '@/lib/feed-service'

export async function GET() {
  try {
    const data = await getSidebarData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to get sidebar data:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取侧栏数据失败' },
      { status: 500 }
    )
  }
}
