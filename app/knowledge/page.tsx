import Link from 'next/link'
import {
  Apple,
  Baby,
  Bandage,
  BookOpen,
  Brain,
  BriefcaseMedical,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  PawPrint,
  ShieldPlus,
  Sparkles,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { FollowButton } from '@/components/follow-button'
import { getKnowledgeHomeData, getSourcePlatformMeta, type KnowledgeArticle, type KnowledgeCategoryKey } from '@/lib/knowledge-service'

const quickCategories: Array<{
  label: KnowledgeCategoryKey
  icon: typeof BookOpen
  className: string
}> = [
  { label: '新手指南', icon: BookOpen, className: 'bg-orange-50 text-orange-500' },
  { label: '健康护理', icon: BriefcaseMedical, className: 'bg-emerald-50 text-emerald-500' },
  { label: '行为训练', icon: ShieldPlus, className: 'bg-blue-50 text-blue-500' },
  { label: '营养饮食', icon: Apple, className: 'bg-rose-50 text-rose-500' },
]

const categoryIcons: Record<KnowledgeCategoryKey, typeof BookOpen> = {
  新手指南: BookOpen,
  健康护理: BriefcaseMedical,
  行为训练: ShieldPlus,
  营养饮食: Apple,
  日常照顾: Baby,
  宠物心理: Heart,
  繁育知识: Brain,
  急救知识: Bandage,
}

function formatViews(views: number) {
  if (views >= 10000) return `${(views / 10000).toFixed(1).replace(/\.0$/, '')}w`
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(views)
}

export default async function KnowledgePage() {
  const data = await getKnowledgeHomeData()

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#2e1a14]">
      <Navbar activeLabel="知识" />

      <section className="relative overflow-hidden border-b border-black/5 bg-[linear-gradient(110deg,#fffdfa_0%,#fff7e9_48%,#fffdf8_100%)] pt-[122px] sm:pt-[126px] xl:pt-[74px]">
        <div className="pointer-events-none absolute left-[42%] top-24 hidden text-[#ffbe46]/30 xl:block">
          <Sparkles className="h-12 w-12" />
        </div>
        <div className="pointer-events-none absolute right-16 top-28 hidden text-[#f3c15d]/45 xl:block">
          <PawPrint className="h-8 w-8 rotate-12" />
        </div>

        <div className="mx-auto grid max-w-[1520px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-14 xl:px-10">
          <div className="max-w-[620px]">
            <h1 className="text-[42px] font-black leading-[1.12] tracking-normal text-[#17110d] sm:text-[58px] lg:text-[64px]">
              分享养宠知识
              <br />
              让爱<span className="px-1 text-[#f5a400]">更</span>专业
            </h1>
            <p className="mt-6 max-w-[460px] text-[16px] leading-8 text-[#7f7167]">
              科学养宠，快乐陪伴，让每一个毛孩子都健康成长
            </p>
            <Link
              href="#latest"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#ffa90c] px-7 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(255,169,12,0.26)] transition hover:bg-[#f39c00]"
            >
              <BookOpen className="h-4 w-4" />
              探索知识
            </Link>

            <div className="mt-8 grid max-w-[520px] grid-cols-2 gap-4 sm:grid-cols-4">
              {quickCategories.map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.label} href={`#${item.label}`} className="group text-center">
                    <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${item.className} transition group-hover:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="mt-3 block text-[14px] font-semibold text-[#5b4c41]">{item.label}</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div className="relative min-h-[320px] lg:min-h-[420px]">
            <div className="absolute bottom-0 right-0 h-[78%] w-[86%] rounded-[42%_58%_30%_70%/55%_45%_55%_45%] bg-[#fbefd7]" />
            <div className="absolute right-2 top-4 hidden rounded-[42px] border border-[#f3dfbd] bg-white/86 px-7 py-5 text-[16px] font-bold leading-7 text-[#524337] shadow-[0_20px_50px_rgba(91,71,45,0.12)] backdrop-blur sm:block">
              科学养宠
              <br />
              从知识开始
            </div>
            <div className="relative mx-auto flex h-full max-w-[620px] items-end justify-center">
              <img
                src="https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=1100&q=90"
                alt="狗狗和猫咪"
                className="relative z-10 max-h-[430px] w-full rounded-[36px] object-cover object-center shadow-[0_24px_70px_rgba(126,88,44,0.16)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1520px] gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[1fr_300px] xl:px-10">
        <div className="min-w-0 space-y-10">
          <section>
            <SectionHeader title="热门知识" action="查看更多" />
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {data.featured.map((article) => (
                <FeaturedCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          <section id="latest">
            <SectionHeader title="最新知识" />
            <div className="mt-5 space-y-4">
              {data.latest.map((article) => (
                <LatestCard key={article.id} article={article} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#eadfce] bg-white px-8 text-[14px] font-bold text-[#6d5e52] shadow-sm transition hover:bg-[#fff8eb]"
              >
                查看更多文章
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
          <SidePanel title="知识分类" action="全部分类">
            <div className="space-y-3">
              {data.categories.map((category) => {
                const Icon = categoryIcons[category.name]
                return (
                  <a
                    id={category.name}
                    key={category.name}
                    href={`/search?q=${encodeURIComponent(category.name)}&tab=content`}
                    className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-[#fff8eb]"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${category.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#51443b]">{category.name}</span>
                    <span className="text-[13px] text-[#a2968d]">{category.count} 篇</span>
                  </a>
                )
              })}
            </div>
          </SidePanel>

          <div className="overflow-hidden rounded-[18px] border border-[#f5e4c4] bg-[#fff3d8] shadow-[0_18px_45px_rgba(91,71,45,0.07)]">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[18px] font-black text-[#2e1a14]">
                  <Sparkles className="h-5 w-5 text-[#ffa90c]" />
                  {data.tip.title}
                </h3>
                <PawPrint className="h-5 w-5 text-[#e6b65d]" />
              </div>
              <p className="mt-3 text-[14px] leading-7 text-[#68584b]">{data.tip.body}</p>
            </div>
            <img
              src={data.tip.imageUrl}
              alt={data.tip.title}
              className="h-32 w-full object-cover"
            />
          </div>

          <SidePanel title="专家作者" action="查看更多">
            <div className="space-y-4">
              {data.authors.map((author) => (
                <div key={author.name} className="flex items-center gap-3">
                  <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[#2e1a14]">{author.name}</p>
                    <p className="truncate text-[12px] text-[#8f8379]">{author.title}</p>
                  </div>
                  {author.id ? (
                    <FollowButton userId={author.id} size="sm" showCount={false} />
                  ) : (
                    <button className="h-8 rounded-full bg-[#ffa90c] px-4 text-[12px] font-bold text-white" type="button">
                      关注
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SidePanel>
        </aside>
      </section>
    </main>
  )
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-[22px] font-black text-[#241913]">
        <PawPrint className="h-5 w-5 fill-[#ffa90c] text-[#ffa90c]" />
        {title}
      </h2>
      {action ? (
        <Link href="/search?tab=content" className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#92867b] hover:text-[#f39c00]">
          {action}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}

function FeaturedCard({ article }: { article: KnowledgeArticle }) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-[#ede4d8] bg-white shadow-[0_12px_34px_rgba(91,71,45,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(91,71,45,0.09)]">
      <a href={article.source.url} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-[1.35] overflow-hidden">
          <img src={article.imageUrl} alt={article.title} className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-105" />
          <PlatformBadge platform={article.source.platform} />
        </div>
        <div className="p-4">
          <p className="text-[12px] font-bold text-[#ff8a00]">{article.category}</p>
          <h3 className="mt-2 line-clamp-2 min-h-[44px] text-[16px] font-black leading-6 text-[#2e1a14]">{article.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-[13px] leading-6 text-[#8b7d72]">{article.summary}</p>
          <ArticleMeta article={article} compact />
        </div>
      </a>
    </article>
  )
}

function LatestCard({ article }: { article: KnowledgeArticle }) {
  return (
    <article className="rounded-[16px] border border-[#ede4d8] bg-white p-3 shadow-[0_10px_28px_rgba(91,71,45,0.04)] transition hover:border-[#f1d8a9] hover:bg-[#fffdf8] sm:flex sm:items-center sm:gap-5">
      <a href={article.source.url} target="_blank" rel="noreferrer" className="relative block aspect-[1.7] overflow-hidden rounded-[12px] sm:h-[118px] sm:w-[220px] sm:shrink-0">
        <img src={article.imageUrl} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
        <PlatformBadge platform={article.source.platform} compact />
      </a>
      <div className="min-w-0 flex-1 pt-4 sm:pt-0">
        <a href={article.source.url} target="_blank" rel="noreferrer" className="line-clamp-1 text-[18px] font-black text-[#2e1a14] hover:text-[#f39c00]">{article.title}</a>
        <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-[#817369]">{article.summary}</p>
        <ArticleMeta article={article} />
      </div>
      <div className="mt-3 flex items-center gap-1 text-[13px] text-[#a2968d] sm:mt-0">
        <Eye className="h-4 w-4" />
        {formatViews(article.views)}
      </div>
    </article>
  )
}

function ArticleMeta({ article, compact = false }: { article: KnowledgeArticle; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-[12px] text-[#9b9087] ${compact ? 'mt-4' : 'mt-3'}`}>
      <img src={article.author.avatarUrl} alt={article.author.name} className="h-5 w-5 rounded-full object-cover" />
      <span className="truncate font-semibold text-[#6b5d53]">{article.author.name}</span>
      <span className="rounded-full bg-[#fff3d8] px-2 py-0.5 font-semibold text-[#c47a00]">{article.source.platform}</span>
      {!compact ? <span className="rounded-full bg-[#f7f2eb] px-2 py-0.5">{article.category}</span> : null}
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3.5 w-3.5" />
        {compact ? formatViews(article.views) : article.createdAt}
      </span>
    </div>
  )
}

function PlatformBadge({ platform, compact = false }: { platform: string; compact?: boolean }) {
  const meta = getSourcePlatformMeta(platform)

  return (
    <span
      className={[
        'absolute left-3 top-3 rounded-full font-bold shadow-[0_8px_18px_rgba(15,23,42,0.16)]',
        meta.color,
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]',
      ].join(' ')}
    >
      {meta.label}
    </span>
  )
}

function SidePanel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[#ede4d8] bg-white p-5 shadow-[0_14px_36px_rgba(91,71,45,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[18px] font-black text-[#2e1a14]">{title}</h3>
        {action ? (
          <Link href="/search?tab=content" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#a0968c] hover:text-[#f39c00]">
            {action}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
