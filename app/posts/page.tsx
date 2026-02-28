import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import { Post, Tag, Category } from '@prisma/client'

type PostWithRelations = Post & {
  tags: Tag[]
  categories: Category[]
}

export default async function PostsPage() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, deletedAt: null },
      include: { tags: true, categories: true },
      orderBy: { publishedAt: 'desc' },
    }) as PostWithRelations[]

    return (
      <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,212,255,0.05),transparent)] pointer-events-none" />

        <main className="relative z-10 pt-24 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs font-mono text-slate-500 tracking-widest">// 全部文章</span>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
              </div>
              <h1 className="text-2xl font-bold font-mono text-slate-200">
                <span className="text-cyan-500">&gt;</span> 文章列表
              </h1>
              <p className="text-xs font-mono text-slate-600 mt-1">
                共 {posts.length} 篇已发布文章
              </p>
            </div>

            {/* Post list */}
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post, idx) => (
                  <Link key={post.id} href={`/posts/${post.id}`} className="group block cursor-pointer">
                    <article className="bg-[#0e0e1a] border border-slate-800/80 relative overflow-hidden hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.07)] hover:-translate-y-0.5">
                      {/* Pixel corners */}
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40 group-hover:border-cyan-400 transition-colors" />
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/40 group-hover:border-cyan-400 transition-colors" />
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/40 group-hover:border-purple-400 transition-colors" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/40 group-hover:border-purple-400 transition-colors" />

                      <div className="flex gap-0">
                        {/* Index bar */}
                        <div className="hidden sm:flex items-center justify-center w-14 shrink-0 border-r border-slate-800/60 bg-slate-900/30">
                          <span className="text-xs font-mono text-slate-700 group-hover:text-cyan-600 transition-colors writing-mode-vertical">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Cover image */}
                        {post.coverImage && (
                          <div className="w-32 sm:w-40 shrink-0 bg-slate-900 overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                          <div>
                            {/* Categories + tags */}
                            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                              {post.categories.map((c) => (
                                <span key={c.id} className="px-2 py-0.5 text-xs font-mono bg-cyan-500/8 text-cyan-500 border border-cyan-500/20">
                                  [{c.name}]
                                </span>
                              ))}
                              {post.tags.slice(0, 3).map((t) => (
                                <span key={t.id} className="text-xs font-mono text-purple-400/60">#{t.name}</span>
                              ))}
                            </div>

                            {/* Title */}
                            <h2 className="text-base font-semibold font-mono text-slate-200 mb-2 group-hover:text-cyan-300 transition-colors leading-snug">
                              {post.title}
                            </h2>

                            {/* Excerpt */}
                            {post.excerpt && (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60">
                            <time className="text-xs font-mono text-slate-600">
                              {dayjs(post.publishedAt).format('YYYY-MM-DD')}
                            </time>
                            <span className="text-xs font-mono text-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                              阅读全文 →
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border border-slate-800 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
                <p className="text-xs font-mono text-slate-600">
                  <span className="text-cyan-500">&gt;</span> 暂无发布的文章
                  <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('获取文章列表错误:', error)
    return (
      <div className="min-h-screen bg-[#080810] relative overflow-hidden">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <main className="relative z-10 pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-mono text-slate-400">
              <span className="text-red-400">[错误]</span> 加载文章列表时出现错误，请稍后重试
            </p>
          </div>
        </main>
      </div>
    )
  }
}
