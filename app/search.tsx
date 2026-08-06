import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import SearchPageClient from './search/-search-page-client'

export const Route = createFileRoute('/search')({ component: SearchPage })

function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  )
}
