import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import { Navbar } from '@/components/navbar'

export default async function Home() {
  try {
    const [posts, categories, tags] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        include: { tags: true, categories: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { posts: { where: { published: true } } } },
        },
        orderBy: { posts: { _count: 'desc' } },
      }),
      prisma.tag.findMany({
        include: {
          _count: { select: { posts: { where: { published: true } } } },
        },
        orderBy: { posts: { _count: 'desc' } },
        take: 24,
      }),
    ])

    const latestFour = posts.slice(0, 4)

    return (
      <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
        {/* Pixel grid background */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        {/* Top radial glow */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,212,255,0.07),transparent)] pointer-events-none" />
        {/* Bottom-right secondary glow */}
        <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent)] pointer-events-none" />

        <Navbar />

        <main className="relative z-10 pt-28 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* ── Hero ── */}
            <div className="mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-cyan-500/30 bg-cyan-500/5 text-xs text-cyan-400 font-mono tracking-widest">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                系统在线 · AI 博客 v2.0
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold font-mono mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  欢迎来到
                </span>
                <br />
                <span className="text-white">xuxiweii的博客</span>
              </h1>

              <p className="text-base text-slate-400 font-mono flex items-center gap-2">
                <span className="text-cyan-500 text-lg leading-none">&gt;</span>
                分享技术、生活与思考
                <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse align-middle" />
              </p>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-4">
                {[
                  { label: '文章', value: posts.length },
                  { label: '分类', value: categories.length },
                  { label: '标签', value: tags.length },
                ].map((stat) => (
                  <div key={stat.label} className="border border-slate-800 bg-slate-900/50 px-5 py-2.5 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-500/50" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-500/50" />
                    <span className="text-2xl font-bold font-mono text-cyan-400">{stat.value}</span>
                    <span className="text-xs text-slate-600 font-mono ml-2">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <section className="mb-14">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-xs font-mono text-slate-500 tracking-widest">// 分类</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group flex items-center gap-2 px-4 py-2 border border-slate-800 bg-slate-900/30 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-200 cursor-default"
                    >
                      <span className="text-xs font-mono text-slate-400 group-hover:text-cyan-300 transition-colors">
                        [{cat.name}]
                      </span>
                      <span className="text-xs font-mono text-slate-700 group-hover:text-cyan-600 transition-colors">
                        {cat._count.posts}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 最近文章（最新4篇）── */}
            {latestFour.length > 0 && (
              <section className="mb-14">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-xs font-mono text-slate-500 tracking-widest">// 最近文章</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                  <Link href="/posts" className="text-xs font-mono text-slate-600 hover:text-cyan-400 transition-colors">
                    查看更多 →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {latestFour.map((post, idx) => (
                    <Link key={post.id} href={`/posts/${post.id}`} className="group cursor-pointer">
                      <article className="h-full bg-[#0e0e1a] border border-slate-800/80 relative overflow-hidden hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,212,255,0.08)] hover:-translate-y-0.5">
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40 group-hover:border-cyan-400 transition-colors z-10" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/40 group-hover:border-cyan-400 transition-colors z-10" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/40 group-hover:border-purple-400 transition-colors z-10" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/40 group-hover:border-purple-400 transition-colors z-10" />

                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          {idx === 0 && (
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5">最新</span>
                          )}
                          <span className="text-xs font-mono text-slate-700 group-hover:text-cyan-600 transition-colors">
                            [{String(idx + 1).padStart(2, '0')}]
                          </span>
                        </div>

                        {post.coverImage && (
                          <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                            />
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                            {post.categories.map((c) => (
                              <span key={c.id} className="px-2 py-0.5 text-xs font-mono bg-cyan-500/8 text-cyan-500 border border-cyan-500/20">
                                [{c.name}]
                              </span>
                            ))}
                          </div>
                          <h2 className="text-sm font-semibold font-mono text-slate-200 mb-2 group-hover:text-cyan-300 transition-colors leading-snug">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            <div className="flex gap-2 flex-wrap">
                              {post.tags.slice(0, 2).map((t) => (
                                <span key={t.id} className="text-xs font-mono text-purple-400/60">#{t.name}</span>
                              ))}
                            </div>
                            <time className="text-xs font-mono text-slate-600 shrink-0">
                              {dayjs(post.publishedAt).format('YYYY-MM-DD')}
                            </time>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {posts.length > 4 && (
                  <div className="mt-5 text-center">
                    <Link
                      href="/posts"
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono border border-slate-800 text-slate-500 hover:border-cyan-500/40 hover:text-cyan-400 transition-all duration-200"
                    >
                      查看全部 {posts.length} 篇文章 →
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* ── Tag cloud ── */}
            {tags.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-xs font-mono text-slate-500 tracking-widest">// 标签</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="group flex items-center gap-1.5 px-3 py-1 border border-slate-800/80 bg-slate-900/20 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 cursor-default"
                    >
                      <span className="text-xs font-mono text-purple-400/60 group-hover:text-purple-400 transition-colors">
                        #{tag.name}
                      </span>
                      <span className="text-xs font-mono text-slate-700">{tag._count.posts}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {posts.length === 0 && (
              <div className="text-center py-24">
                <div className="inline-block border border-slate-800 px-10 py-8 font-mono relative">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
                  <p className="text-slate-500 text-sm">
                    <span className="text-cyan-500">&gt;</span> 暂无发布的文章
                    <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                  </p>
                </div>
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
        <Navbar />
        <main className="relative z-10 pt-28 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-white font-mono mb-4">欢迎来到我的博客</h1>
            <p className="text-sm text-slate-400 font-mono">
              <span className="text-red-400">[错误]</span> 加载文章列表时出现错误，请稍后重试
            </p>
          </div>
        </main>
      </div>
    )
  }
}
