import { NextResponse } from 'next/server'
import { getUserProfileSummary } from '@/lib/feed-service'
import { syncCurrentPlatformUser } from '@/lib/platform-user'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await syncCurrentPlatformUser()
    const user = await getUserProfileSummary(id, currentUser?.id)

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isKnowledgeCreator: user.isKnowledgeCreator,
        bio: user.bio,
        location: user.location,
        website: user.website,
        headerColor: user.headerColor,
        headerImage: user.headerImage,
        joinedAt: user.joinedAt,
        postsCount: user.postsCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        likesCount: user.likesCount,
        isFollowing: user.isFollowing,
      },
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    )
  }
}
