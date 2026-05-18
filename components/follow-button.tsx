'use client'

import { useState } from 'react'
import { Loader2, Plus, Check } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type FollowButtonProps = {
  userId: string
  initialFollowing?: boolean
  initialFollowersCount?: number
  onChange?: (next: { following: boolean; followersCount: number }) => void
  size?: 'sm' | 'md'
  showCount?: boolean
}

export function FollowButton({
  userId,
  initialFollowing = false,
  initialFollowersCount = 0,
  onChange,
  size = 'md',
  showCount = true,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        return
      }

      const response = await fetch(`/api/user/${userId}/follow`, {
        method: following ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(body?.message ?? '操作失败')
      }

      const data = (await response.json()) as {
        following: boolean
        followersCount: number
      }

      setFollowing(data.following)
      setFollowersCount(data.followersCount)
      onChange?.({ following: data.following, followersCount: data.followersCount })
    } catch (error) {
      alert(error instanceof Error ? error.message : '关注失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={[
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition disabled:opacity-60',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-[14px]',
        following
          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          : 'bg-[#f5c233] text-[#2e1a14] hover:bg-[#efba18]',
      ].join(' ')}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {following ? '已关注' : '关注'}
      {showCount ? (
        <span className="text-[12px] opacity-70">{followersCount}</span>
      ) : null}
    </button>
  )
}
