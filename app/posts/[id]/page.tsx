import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import { notFound } from 'next/navigation'
import { Post, Tag, Category } from '@prisma/client'
import { Navbar } from '@/components/navbar'
import { BackButton } from '@/components/back-button'

type PostWithRelations = Post & {
  tags: Tag[]
  categories: Category[]
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const post = await prisma.post.findFirst({
    where: { id, published: true },
    include: { tags: true, categories: true },
  }) as PostWithRelations | null

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
      {/* Pixel grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,212,255,0.05),transparent)] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back link */}
          <BackButton
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-cyan-400 transition-colors mb-10"
          />

          <article>
            {/* Header */}
            <header className="mb-10">
              {/* Categories */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {post.categories.map((category: Category) => (
                  <span
                    key={category.id}
                    className="px-2 py-0.5 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  >
                    [{category.name}]
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold font-mono text-slate-100 mb-5 leading-tight">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex items-center gap-4 flex-wrap">
                <time className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                  <span className="text-cyan-600">&gt;</span>
                  {dayjs(post.publishedAt).format('YYYY年MM月DD日')}
                </time>
                {post.tags.length > 0 && (
                  <>
                    <span className="text-slate-800">·</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.tags.map((tag: Tag) => (
                        <span key={tag.id} className="text-xs font-mono text-purple-400/70">#{tag.name}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="mt-6 h-px bg-gradient-to-r from-cyan-500/30 via-purple-500/20 to-transparent" />
            </header>

            {/* Cover image */}
            {post.coverImage && (
              <div className="mb-8 overflow-hidden border border-slate-800 relative">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40 z-10" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/40 z-10" />
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full opacity-90"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:font-mono prose-headings:text-slate-200 prose-headings:font-bold
              prose-p:text-slate-400 prose-p:leading-relaxed
              prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300
              prose-code:text-cyan-300 prose-code:bg-slate-900 prose-code:border prose-code:border-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0e0e1a] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-none
              prose-blockquote:border-l-cyan-500/50 prose-blockquote:text-slate-500
              prose-strong:text-slate-200
              prose-hr:border-slate-800
              prose-img:border prose-img:border-slate-800
            ">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between">
              <BackButton
                className="text-xs font-mono text-slate-600 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
              />
              <span className="text-xs font-mono text-slate-700">
                {dayjs(post.publishedAt).format('YYYY-MM-DD')}
              </span>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
