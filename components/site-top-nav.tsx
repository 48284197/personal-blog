'use client'

import { SiteNav } from '@/components/site-nav'

type SiteTopNavProps = {
  userHref: string
  userName?: string | null
  className?: string
}

export function SiteTopNav({ userHref, userName, className }: SiteTopNavProps) {
  return (
    <div className={className ?? 'fixed left-0 right-0 top-4 z-40 px-4 sm:px-6 lg:px-8'}>
      <SiteNav userHref={userHref} userName={userName} />
    </div>
  )
}

