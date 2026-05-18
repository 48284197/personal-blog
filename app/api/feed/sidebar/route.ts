import { NextResponse } from 'next/server'
import { getSidebarData } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'

export async function GET() {
  try {
    const currentUser = await syncCurrentPlatformUser()
    const data = await getSidebarData(currentUser?.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to get sidebar data:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取侧栏数据失败' },
      { status: 500 }
    )
  }
}
