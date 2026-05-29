'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.localStorage.removeItem('carbon-user-name')
    window.localStorage.removeItem('carbon-user-id')
    window.localStorage.removeItem('carbon-user-email')
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? 'inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800'}
    >
      <LogOut className="h-4 w-4" />
      退出登录
    </button>
  )
}
