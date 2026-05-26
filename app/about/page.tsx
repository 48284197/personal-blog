import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Heart,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  MessageCircle,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'

export const metadata: Metadata = {
  title: '关于我们',
}

const stats = [
  { value: '50万+', label: '宠物用户', icon: Users },
  { value: '200万+', label: '萌宠分享', icon: Mail },
  { value: '1000万+', label: '互动点赞', icon: Heart },
  { value: '温暖有爱', label: '连接你我', icon: Heart },
]

const pillars = [
  {
    title: '我们的愿景',
    icon: ShieldCheck,
    description: '成为最温暖、最有爱的宠物社区，让每一次分享都被温柔以待。',
    image:
      'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80',
    tint: 'from-[#fff9e7] to-[#fffdf8]',
  },
  {
    title: '我们的使命',
    icon: Heart,
    description: '连接宠物与主人，记录美好瞬间，传递科学养宠知识，守护每一份陪伴。',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1f?auto=format&fit=crop&w=900&q=80',
    tint: 'from-[#fff4ef] to-[#fffdf8]',
  },
  {
    title: '我们的价值观',
    icon: Star,
    description: '真诚分享，友善互动，尊重生命，科学养宠，陪伴成长。',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    tint: 'from-[#fff8e7] to-[#fffdf8]',
  },
]

const contacts = [
  { label: 'support@maoqiu.com', icon: Mail },
  { label: '400-123-4567', icon: Phone },
  { label: '成都', icon: MapPin },
]

const socials = [
  { label: '微信', color: 'bg-[#e6f6dc] text-[#44b56a]' },
  { label: '微博', color: 'bg-[#ffe8e4] text-[#ff6a57]' },
  { label: '抖音', color: 'bg-[#f1f2f6] text-[#111111]' },
  { label: '小红书', color: 'bg-[#ffe7ef] text-[#ff7b9c]' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fbf4e8] text-[#2e1a14]">
      <Navbar activeLabel="关于我们" showPublish userAvatarSrc="/logo.png" userName="毛球" />

      <div className="mx-auto max-w-[1520px] px-4 pb-10 pt-[122px] sm:px-6 xl:px-10">
        <section className="relative overflow-hidden rounded-[48px] bg-[linear-gradient(180deg,#fff9ef_0%,#fffdf9_100%)] px-5 pb-8 pt-14 shadow-[0_18px_45px_rgba(15,23,42,0.04)] sm:px-8 xl:px-12 xl:pb-10 xl:pt-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-6%] top-[22%] h-40 w-40 rounded-full bg-[#fff1ce]/70 blur-3xl" />
            <div className="absolute right-[-5%] top-[10%] h-48 w-48 rounded-full bg-[#fff1ce]/60 blur-3xl" />
            <div className="absolute left-[16%] top-[22%] h-6 w-6 rounded-full bg-[#ffd9a6]/90 blur-[1px]" />
            <div className="absolute right-[23%] top-[18%] h-4 w-4 rounded-full bg-[#f8c04e]/90 blur-[1px]" />
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <div className="relative z-10 max-w-[620px]">
              <h1 className="text-[clamp(3rem,5.6vw,6.2rem)] font-black leading-[0.95] tracking-[-0.07em] text-[#2f1a12]">
                关于毛球
              </h1>
              <h2 className="mt-5 text-[clamp(1.6rem,2.3vw,2.7rem)] font-black tracking-[-0.05em] text-[#2f1a12]">
                温暖有爱的宠物社区
              </h2>

              <p className="mt-7 max-w-[560px] text-[18px] leading-8 text-[#5d5047]">
                毛球是一个记录、分享、交流的宠物社区。
                在这里，人与宠物建立更深的情感连接，
                一起发现、一起成长，让生活因毛孩子更美好。
              </p>
            </div>

            <div className="relative z-10 flex min-h-[360px] items-end justify-center xl:min-h-[520px] xl:justify-end">
              <div className="relative h-[420px] w-full max-w-[760px] sm:h-[500px] xl:h-[560px]">
                <Image
                  src="https://xuxiweii.s3.bitiful.net/uploads/1777434188799-h1cj144us1k-UI.png"
                  alt="关于毛球主视觉"
                  fill
                  priority
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-contain object-center"
                  unoptimized
                />

                <div className="absolute left-[6%] top-[22%] hidden rounded-full border-[3px] border-[#2e1a14] bg-white p-3 shadow-[0_10px_20px_rgba(15,23,42,0.06)] xl:block">
                  <MessageCircle className="h-8 w-8 text-[#2e1a14]" />
                </div>

                <div className="absolute left-[2%] top-[35%] hidden rotate-[-14deg] xl:block">
                  <PawPrint className="h-10 w-10 text-[#f2ba69]" />
                </div>

                <div className="absolute right-[6%] top-[18%] hidden w-[176px] rotate-[8deg] rounded-[26px] border-4 border-[#f5c233] bg-[#ffe889] px-4 py-4 text-center shadow-[0_16px_30px_rgba(245,194,51,0.16)] xl:block">
                  <div className="mx-auto mb-2 h-5 w-12 rounded-t-[18px] border-4 border-b-0 border-[#f5c233]" />
                  <p className="text-[20px] font-black leading-[1.4] tracking-[-0.04em] text-[#2e1a14]">
                    在毛球
                    <br />
                    遇见美好
                    <br />
                    宠物生活 <span className="text-[#ef5348]">❤</span>
                  </p>
                </div>

                <div className="absolute right-[36%] top-[10%] hidden rotate-12 text-[#2e1a14] xl:block">
                  <Sparkles className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[30px] bg-white/92 px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:px-6 xl:px-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className={[
                      'flex items-center gap-4',
                      index > 0 ? 'xl:border-l xl:border-black/8 xl:pl-8' : '',
                    ].join(' ')}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffe7a8] text-[#2e1a14]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[18px] font-black leading-none text-[#2e1a14]">{item.value}</div>
                      <div className="mt-2 text-[14px] text-[#7d7269]">{item.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[repeat(3,minmax(0,1fr))_320px]">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <Surface
                key={pillar.title}
                className="overflow-hidden border-[#f2e2bf] bg-white/92 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe7a8] text-[#f1a300]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-black tracking-[-0.04em] text-[#1f140f]">
                    {pillar.title}
                  </h3>
                </div>

                <p className="mt-5 max-w-[28ch] text-[16px] leading-7 text-[#6f645a]">
                  {pillar.description}
                </p>

                <div
                  className={`mt-8 overflow-hidden rounded-[24px] bg-gradient-to-b ${pillar.tint} h-[220px]`}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      sizes="(min-width: 1024px) 28vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              </Surface>
            )
          })}

          <Surface className="overflow-hidden border-[#f2e2bf] bg-[linear-gradient(180deg,#fff7ea_0%,#fffdf8_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <h3 className="text-[22px] font-black tracking-[-0.04em] text-[#1f140f]">
              联系我们
            </h3>

            <div className="mt-6 space-y-5">
              {contacts.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3 text-[15px] text-[#5f5348]">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2e1a14]" />
                    <span className="leading-7">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {socials.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-[12px] font-bold ${item.color}`}
                  aria-label={item.label}
                >
                  {item.label.slice(0, 1)}
                </button>
              ))}
            </div>
          </Surface>
        </section>

        <footer className="mt-10 flex flex-col gap-4 border-t border-black/5 py-6 text-[14px] text-[#8f8379] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="毛球" width={50} height={50} className="flex scale-90 items-center justify-center rounded-full object-contain" />
            <div>
              <div className="whitespace-nowrap text-[24px] font-black tracking-[-0.03em] text-[#2e1a14] sm:text-[28px]">毛球</div>
              <div>温暖有爱的宠物社区</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="#" className="transition hover:text-[#2e1a14]">
              用户协议
            </Link>
            <span className="text-black/20">|</span>
            <Link href="#" className="transition hover:text-[#2e1a14]">
              隐私政策
            </Link>
            <span className="text-black/20">|</span>
            <Link href="#" className="transition hover:text-[#2e1a14]">
              帮助中心
            </Link>
            <span className="text-black/20">|</span>
            <Link href="#" className="transition hover:text-[#2e1a14]">
              联系我们
            </Link>
          </div>

          <div>© 2024 毛球宠物社区 版权所有</div>
        </footer>
      </div>
    </main>
  )
}
