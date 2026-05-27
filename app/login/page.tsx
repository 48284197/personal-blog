import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Heart, PenLine } from 'lucide-react'
import { AuthPanel } from '@/components/auth-panel'

export const metadata: Metadata = {
  title: '登录',
}

type LoginPageProps = {
  searchParams?: Promise<{ mode?: string }>
}

const stats = [
  { value: '记录', label: '保存每一次成长瞬间', icon: PenLine },
  { value: '交流', label: '遇见同样认真养宠的人', icon: Heart },
  { value: '知识', label: '把有用经验沉淀下来', icon: BookOpen },
]

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const initialMode = params?.mode === 'register' ? 'register' : 'login'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf1] text-[#2e1a14]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,234,188,0.82),transparent_30%),radial-gradient(circle_at_70%_18%,rgba(255,247,230,0.92),transparent_26%),linear-gradient(180deg,#fff9ee_0%,#fffdf9_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1520px] flex-col px-4 pb-6 pt-5 sm:px-6 lg:pb-8 xl:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap">
            <Image src="/logo.png" alt="毛球" width={50} height={50} className="flex scale-90 items-center justify-center rounded-full object-contain" priority />
            <span className="text-[24px] font-black tracking-[-0.03em] text-[#2e1a14] sm:text-[28px]">毛球</span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 text-[14px] text-[#5f5348] sm:gap-3 sm:text-[15px]">
            <span className="hidden whitespace-nowrap md:inline">还没有账号？</span>
            <Link
              href="/login?mode=register"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-[#f5c233] px-4 text-[14px] font-semibold text-[#f39a00] transition hover:bg-[#fff4d7] sm:px-5 sm:text-[15px]"
            >
              立即注册
            </Link>
          </div>
        </div>

        <div className="grid flex-1 items-start gap-5 py-4 md:gap-6 lg:py-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(460px,1.08fr)] xl:items-center xl:gap-10 xl:py-8">
          <section className="relative isolate flex min-h-[280px] items-start overflow-hidden rounded-[32px] px-1 py-1 sm:min-h-[340px] sm:px-0 lg:min-h-[380px] xl:min-h-[760px]">
            <div className="relative z-10 mx-auto w-full max-w-[760px] xl:mx-0">
              <h1 className="max-w-[560px] text-[clamp(2.1rem,4.5vw,6.5rem)] font-black leading-[0.92] tracking-[-0.07em] text-[#2f1a12]">
                进入毛球，
                <br />
                继续记录陪伴
              </h1>

              <p className="mt-3 max-w-[38rem] text-[14px] leading-6 text-[#6b5d53] sm:text-[15px] sm:leading-7">
                登录后可以发布动态、收藏知识、维护个人主页，也能继续和同样喜欢毛孩子的人保持联结。
              </p>

              <div className="relative mt-3 h-[140px] overflow-hidden rounded-[24px] sm:mt-5 sm:h-[180px] lg:h-[220px] xl:mt-6 xl:h-[560px] xl:rounded-none">
                <Image
                  src="https://xuxiweii.s3.bitiful.net/uploads/1777434188799-h1cj144us1k-UI.png"
                  alt="毛球宠物插画"
                  fill
                  priority
                  sizes="(min-width: 1024px) 700px, 100vw"
                  className="object-contain object-[50%_68%] xl:object-cover"
                  unoptimized
                />

                <div className="absolute inset-x-3 bottom-3 hidden rounded-[24px] border border-white/80 bg-white/92 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:block xl:inset-x-auto xl:bottom-8 xl:left-8 xl:max-w-[calc(100%-48px)] xl:px-6 xl:py-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-6">
                    {stats.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1cc] text-[#2e1a14]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="whitespace-nowrap text-[15px] font-extrabold leading-none text-[#2e1a14] sm:text-[16px]">
                              {item.value}
                            </div>
                            <div className="mt-1 truncate whitespace-nowrap text-[12px] text-[#7f736b] sm:text-[13px]">
                              {item.label}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:hidden">
                {stats.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={`compact-${item.label}`}
                      className="flex min-w-0 items-center gap-3 rounded-[22px] border border-white/80 bg-white/88 px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1cc] text-[#2e1a14]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="whitespace-nowrap text-[15px] font-extrabold leading-none text-[#2e1a14]">
                          {item.value}
                        </div>
                        <div className="mt-1 whitespace-nowrap text-[12px] text-[#7f736b]">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="flex justify-center xl:justify-end">
            <div className="w-full max-w-[620px] xl:max-w-[540px]">
              <AuthPanel redirectTo="/content" initialMode={initialMode} />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
