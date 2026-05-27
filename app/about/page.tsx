import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BookOpen,
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  MessageCircle,
  PenLine,
  ArrowRight,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Surface } from '@/components/landing'

export const metadata: Metadata = {
  title: '关于我们',
}

const focusAreas = [
  {
    title: '记录真实宠物日常',
    description: '不只留下好看的照片，也留下成长、习惯、情绪和那些只有主人懂的小瞬间。',
    icon: PenLine,
  },
  {
    title: '整理有用养宠经验',
    description: '把喂养、清洁、训练、陪伴里的有效经验沉淀下来，让后来的人更容易找到答案。',
    icon: BookOpen,
  },
  {
    title: '连接相似经历的人',
    description: '让新手、老手、同城伙伴和同品种家长，都能在真实交流里得到回应。',
    icon: Users,
  },
]

const values = [
  {
    title: '真实',
    description: '鼓励分享真实经历，不用完美人设制造养宠焦虑。',
    icon: ShieldCheck,
  },
  {
    title: '友善',
    description: '尊重新手提问，也尊重每个家庭不同的陪伴方式。',
    icon: Heart,
  },
  {
    title: '有用',
    description: '让经验能被搜索、收藏和复用，而不是很快淹没在信息流里。',
    icon: Sparkles,
  },
]

const boundaries = [
  '毛球鼓励经验分享，但不会替代专业兽医诊断。',
  '涉及疾病、用药、急救或明显异常状态，请及时咨询专业医生。',
  '我们会持续优化内容审核和知识结构，让社区交流更清晰、更可靠。',
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
                认真记录每一份陪伴
              </h2>

              <p className="mt-7 max-w-[560px] text-[18px] leading-8 text-[#5d5047]">
                毛球是为宠物家长准备的社区。我们希望这里既能记录毛孩子的日常，
                也能整理真正有帮助的养宠经验，让每一次认真陪伴都被看见、被理解。
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-[52px] items-center justify-center rounded-full bg-[#f5c233] px-7 text-[16px] font-bold text-[#2e1a14] shadow-[0_12px_24px_rgba(245,194,51,0.24)] transition hover:bg-[#efba18]"
                >
                  加入毛球
                </Link>
                <Link
                  href="/content"
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-7 text-[16px] font-bold text-[#2e1a14] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:bg-[#faf8f4]"
                >
                  浏览社区
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
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

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {focusAreas.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-[#f2e3c8] bg-white/88 px-5 py-5 shadow-[0_14px_34px_rgba(91,71,45,0.06)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe7a8] text-[#2e1a14]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-black tracking-[-0.03em] text-[#1f140f]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#6f645a]">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Surface className="border-[#f2e2bf] bg-white/92 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="max-w-[680px]">
              <p className="text-[14px] font-bold text-[#c68a00]">社区价值观</p>
              <h2 className="mt-3 text-[28px] font-black tracking-[-0.05em] text-[#1f140f] sm:text-[38px]">
                温柔不是口号，是每天的社区规则
              </h2>
              <p className="mt-4 text-[16px] leading-8 text-[#6f645a]">
                毛球希望把宠物社区从单纯的热闹，慢慢变成更有秩序、更有帮助、也更让人放松的地方。
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {values.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-[22px] bg-[#fff9ef] px-5 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#c68a00] shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 text-[17px] font-black text-[#1f140f]">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[#74685e]">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </Surface>

          <Surface className="border-[#f2e2bf] bg-[linear-gradient(180deg,#fff7ea_0%,#fffdf8_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe7a8] text-[#2e1a14]">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-[26px] font-black tracking-[-0.04em] text-[#1f140f]">
              内容边界
            </h2>
            <div className="mt-5 space-y-4">
              {boundaries.map((item) => (
                <p key={item} className="rounded-[20px] bg-white/78 px-4 py-4 text-[15px] leading-7 text-[#6f645a]">
                  {item}
                </p>
              ))}
            </div>
          </Surface>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Surface className="border-[#f2e2bf] bg-white/92 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-[14px] font-bold text-[#c68a00]">我们在建设的毛球</p>
            <h2 className="mt-3 text-[28px] font-black tracking-[-0.05em] text-[#1f140f] sm:text-[38px]">
              不是冷冰冰的信息流，而是能长期留下来的宠物生活档案
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-[#6f645a]">
              你可以在这里发布日常、整理知识、收藏有用内容，也可以通过主页持续记录毛孩子的变化。
              对毛球来说，社区的意义不是让内容一闪而过，而是让陪伴变得可回看、可分享、可继续。
            </p>
          </Surface>

          <Surface className="relative overflow-hidden border-[#f2e2bf] bg-[#2e1a14] p-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.09)] sm:p-8">
            <div className="pointer-events-none absolute right-[-8%] top-[-18%] h-48 w-48 rounded-full bg-[#f5c233]/24 blur-3xl" />
            <div className="relative z-10">
              <p className="text-[14px] font-bold text-[#ffd979]">下一步</p>
              <h2 className="mt-3 max-w-[620px] text-[30px] font-black leading-tight tracking-[-0.05em] sm:text-[42px]">
                如果你也认真爱着一个毛孩子，欢迎把它的故事带到这里。
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#f5c233] px-6 text-[15px] font-bold text-[#2e1a14] transition hover:bg-[#efba18]"
                >
                  加入毛球
                </Link>
                <Link
                  href="/knowledge"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/18 bg-white/10 px-6 text-[15px] font-bold text-white transition hover:bg-white/16"
                >
                  浏览养宠知识
                </Link>
              </div>
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
