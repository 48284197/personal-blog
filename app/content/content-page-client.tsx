'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ContentFeed } from '@/components/content-feed'
import { Surface } from '@/components/landing'
import { useCommentSheet } from '@/components/comment-sheet'
import { Navbar } from '@/components/navbar'
import { ContentComposer } from '@/components/content-composer'
import type { ContentItem } from '@/lib/site-data'

type ContentPageClientProps = {
  initialItems: ContentItem[]
  initialHasMore: boolean
}

export function ContentPageClient({ initialItems, initialHasMore }: ContentPageClientProps) {
  const [showCompactNav, setShowCompactNav] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [feedVersion, setFeedVersion] = useState(0)
  const { isOpen } = useCommentSheet()

  useEffect(() => {
    const onScroll = () => {
      setShowCompactNav(window.scrollY > window.innerHeight)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const shuffleContent = () => {
    const feed = document.getElementById('feed')
    if (feed) {
      feed.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="relative overflow-hidden bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_32%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.08),transparent_24%)]" />

      {!showCompactNav ? <Navbar /> : null}

      {showCompactNav ? (
        <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-3 sm:right-6 sm:bottom-6">
          <button
            type="button"
            onClick={shuffleContent}
            className="rounded-full bg-white/90 px-3 py-4 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl [writing-mode:vertical-rl] [text-orientation:upright]"
          >
            换一换
          </button>
          <button
            type="button"
            onClick={scrollToTop}
            className="rounded-full bg-slate-900 px-3 py-4 text-sm font-medium text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] [writing-mode:vertical-rl] [text-orientation:upright]"
          >
            回到顶部
          </button>
        </div>
      ) : null}

      <div
        className={[
          'relative mx-auto max-w-4xl pt-16 sm:pt-20 transition-transform duration-300 origin-center',
          isOpen ? 'scale-[0.96] sm:scale-[0.97]' : 'scale-100',
        ].join(' ')}
      >
        <section className="mb-4 mt-4 sm:mt-5">
          <Surface className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">内容流</h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                先看内容，再决定要不要评论、收藏、追问或者继续共创。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              发内容
            </button>
          </Surface>
        </section>

        <div id="feed">
          <ContentFeed
            refreshKey={feedVersion}
            initialItems={initialItems}
            initialHasMore={initialHasMore}
          />
        </div>
      </div>

      <ContentComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => setFeedVersion((current) => current + 1)}
      />
    </main>
  )
}
