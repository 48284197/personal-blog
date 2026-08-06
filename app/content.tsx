import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ContentPageClient } from './content/-content-page-client'
import { listFeedItemsPage } from '@/lib/feed-service'

const FEED_PAGE_SIZE = 10

const loadContentPage = createServerFn().handler(() =>
  listFeedItemsPage({ limit: FEED_PAGE_SIZE, offset: 0 }),
)

export const Route = createFileRoute('/content')({
  loader: () => loadContentPage(),
  component: ContentPage,
})

function ContentPage() {
  const { items, hasMore } = Route.useLoaderData()

  return <ContentPageClient initialItems={items} initialHasMore={hasMore} />
}
