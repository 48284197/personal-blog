import { ContentPageClient } from './content-page-client'
import { listFeedItemsPage } from '@/lib/feed-service'

const FEED_PAGE_SIZE = 10

export default async function ContentPage() {
  const { items, hasMore } = await listFeedItemsPage({ limit: FEED_PAGE_SIZE, offset: 0 })

  return <ContentPageClient initialItems={items} initialHasMore={hasMore} />
}
