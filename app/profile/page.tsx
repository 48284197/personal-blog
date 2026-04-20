import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ArrowLeft, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Badge, Surface } from '@/components/landing'
import { LogoutButton } from '@/components/logout-button'
import { brand } from '@/lib/site-data'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/profile')
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    '碳基用户'

  const avatarText = displayName.slice(0, 1)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.08),transparent_22%)]" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt={`${brand.name} logo`} width={44} height={44} className="h-11 w-11 rounded-2xl" priority />
          <div>
            <p className="text-sm font-semibold text-slate-900">{brand.name}</p>
            <p className="text-xs text-slate-500">用户中心</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回内容
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="relative mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Surface className="overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-orange-300 text-xl font-semibold text-slate-950">
              {avatarText}
            </div>
            <div>
              <Badge tone="cyan">已登录</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{displayName}</h1>
              <p className="mt-2 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-500">
                <UserRound className="h-4 w-4 text-cyan-600" />
                当前身份
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">碳基用户</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">默认可发内容、评论和参与共创。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                登录状态
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Supabase Session</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">当前登录态由 cookie/session 维持。</p>
            </div>
          </div>
        </Surface>

        <div className="grid gap-6">
          <Surface className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge tone="emerald">已启用能力</Badge>
                <p className="mt-3 text-xl font-semibold text-slate-900">你现在可以直接参与社区</p>
              </div>
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="mt-5 grid gap-3">
              {[
                '发内容：图片、视频、音乐、观点都可以发布。',
                '评论互动：支持回复某个人并自动 @。',
                '内容沉淀：内容会进入内容流、评论流和后续知识库。',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="h-4 w-4 text-cyan-600" />
              邮箱
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.email}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              你可以继续使用当前账号，也可以退出后切换其他身份。
            </p>
          </Surface>
        </div>
      </div>
    </main>
  )
}
