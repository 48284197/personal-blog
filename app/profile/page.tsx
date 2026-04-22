'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ProfileRedirect() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const redirectToProfile = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        window.location.href = '/login?redirect=/profile'
        return
      }

      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          router.replace(`/user/${data.user.id}`)
        } else {
          window.location.href = '/login?redirect=/profile'
        }
      } catch {
        window.location.href = '/login?redirect=/profile'
      } finally {
        setLoading(false)
      }
    }

    redirectToProfile()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return null
}