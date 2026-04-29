import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Heart, Sparkles, Users } from 'lucide-react'
import { AuthPanel } from '@/components/auth-panel'
import { brand } from '@/lib/site-data'

export const metadata: Metadata = {
  title: '登录',
}

type LoginPageProps = {
  searchParams?: Promise<{ mode?: string }>
}

const stats = [
  { value: '50万+', label: '宠物用户', icon: Users },
  { value: '200万+', label: '萌宠分享', icon: Heart },
  { value: '1000万+', label: '互动点赞', icon: Sparkles },
]

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const initialMode = params?.mode === 'register' ? 'register' : 'login'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf1] text-[#2e1a14]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,234,188,0.82),transparent_30%),radial-gradient(circle_at_70%_18%,rgba(255,247,230,0.92),transparent_26%),linear-gradient(180deg,#fff9ee_0%,#fffdf9_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1520px] flex-col px-4 pb-6 pt-5 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c233] shadow-[0_10px_20px_rgba(245,194,51,0.26)]">
              <Image src="/logo.png" alt={`${brand.name} logo`} width={28} height={28} className="h-7 w-7 object-contain" priority />
            </span>
            <span className="text-[28px] font-black tracking-[-0.04em] text-[#2e1a14]">毛球</span>
          </Link>

          <div className="flex items-center gap-3 text-[15px] text-[#5f5348]">
            <span className="hidden sm:inline">还没有账号？</span>
            <Link
              href="/login?mode=register"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#f5c233] px-5 text-[15px] font-semibold text-[#f39a00] transition hover:bg-[#fff4d7]"
            >
              立即注册
            </Link>
          </div>
        </div>

        <div className="grid flex-1 items-start gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-10">
          <section className="relative isolate flex min-h-[520px] items-start overflow-hidden rounded-[40px] px-2 py-4 sm:px-0 lg:min-h-[760px]">
            <div className="relative z-10 max-w-[660px]">
              <h1 className="max-w-[560px] text-[clamp(3rem,5.8vw,6.5rem)] font-black leading-[0.92] tracking-[-0.07em] text-[#2f1a12]">
                和有趣的人
                <br />
                分享萌宠生活
              </h1>

              <div className="relative mt-4 h-[280px] overflow-hidden sm:mt-6 sm:h-[360px] lg:h-[560px]">
                <Image
                  src="https://xuxiweii.s3.bitiful.net/uploads/1777434188799-h1cj144us1k-UI.png"
                  alt="毛球宠物插画"
                  fill
                  priority
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-cover object-[50%_68%]"
                  unoptimized
                />

                <div className="absolute bottom-6 left-0 rounded-[30px] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:left-8 sm:bottom-8 sm:px-6 sm:py-4">
                  <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                    {stats.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1cc] text-[#2e1a14]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[16px] font-extrabold leading-none text-[#2e1a14]">
                              {item.value}
                            </div>
                            <div className="mt-1 text-[13px] text-[#7f736b]">
                              {item.label}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[540px]">
              <AuthPanel redirectTo="/content" initialMode={initialMode} />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
