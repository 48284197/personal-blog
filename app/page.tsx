import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  Play,
  PawPrint,
  PenLine,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { HomeDiscoverList } from "@/components/home-discover-list";

const topics = ["推荐", "关注", "日常", "养宠知识", "求助问答", "萌宠故事"];

const valueCards = [
  {
    title: "记录日常",
    body: "晒图、视频、音乐和小片段，把毛孩子的变化留在自己的主页里。",
    icon: PenLine,
  },
  {
    title: "沉淀知识",
    body: "把有用经验整理成可搜索的养宠知识，新手也能少走弯路。",
    icon: BookOpen,
  },
  {
    title: "找到同伴",
    body: "围绕真实经历交流，遇见同样认真生活、认真养宠的人。",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f9f3e7] text-[#2e1a14]">
      <Navbar />

      <main className="pt-[74px]">
        <section className="relative overflow-hidden border-b border-black/5 bg-[linear-gradient(180deg,#fbf6eb_0%,#fbf7ef_52%,#fffdf9_100%)]">
          <div className="mx-auto grid w-full max-w-[1520px] gap-8 px-4 pb-20 pt-16 sm:px-6 xl:grid-cols-[0.92fr_1.08fr] xl:px-10 xl:pb-24 xl:pt-20">
            <div className="flex flex-col justify-center pb-10 xl:pb-20">
              <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#f6d99b] bg-white/70 px-4 py-2 text-[14px] font-semibold text-[#c68a00] shadow-[0_10px_30px_rgba(245,194,51,0.12)]">
                <PawPrint className="h-4 w-4" />
                宠物日常、养宠知识和同伴交流
              </p>

              <h1 className="max-w-[560px] text-[clamp(3rem,5.4vw,6.2rem)] font-black leading-[0.98] tracking-[-0.06em] text-[#2f1a12]">
                记录毛孩子的
                <br />
                每一个今天
              </h1>

              <p className="mt-8 text-[18px] leading-8 text-[#65584f] sm:text-[20px]">
                在毛球，分享真实宠物日常，沉淀有用养宠经验，也找到懂它的人。
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-[#f5c233] px-10 text-[17px] font-bold text-[#2e1a14] shadow-[0_12px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#efba18]"
                >
                  加入毛球
                </Link>
                <Link
                  href="/knowledge"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-10 text-[17px] font-bold text-[#2e1a14] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:bg-[#faf8f4]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                  浏览养宠知识
                </Link>
              </div>

              <div className="mt-12 grid gap-3 sm:grid-cols-3">
                {valueCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[22px] border border-[#f2e3c8] bg-white/75 px-4 py-4 shadow-[0_12px_30px_rgba(91,71,45,0.06)]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0c8] text-[#2e1a14]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 text-[15px] font-black text-[#2e1a14]">{item.title}</div>
                      <p className="mt-2 text-[13px] leading-6 text-[#7b6c61]">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-end justify-center xl:min-h-[300px]">
              <div className="relative w-full max-w-[780px]">
                <div className="relative h-[520px] w-full sm:h-[600px] xl:h-[660px]">
                  <Image
                    src="https://xuxiweii.s3.bitiful.net/uploads/1777434188799-h1cj144us1k-UI.png"
                    alt="宠物主视觉"
                    fill
                    sizes="(min-width: 1024px) 780px, 100vw"
                    className="object-contain "
                    unoptimized
                  />
                </div>

                <div className="absolute bottom-12 left-1/2 w-[92%] -translate-x-1/2 rounded-full border border-white/80 bg-white px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:w-[88%] sm:px-6 sm:py-4">
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex -space-x-3">
                      {["#f6c27a", "#c9a18a", "#f3e0ce", "#d7c5af"].map(
                        (color, index) => (
                          <span
                            key={color}
                            className="h-11 w-11 rounded-full border-2 border-white shadow-sm"
                            style={{
                              background: color,
                              marginLeft: index === 0 ? 0 : undefined,
                            }}
                          />
                        ),
                      )}
                    </div>
                    <div className="min-w-0 text-[15px] text-[#4d4037]">
                      <p className="truncate">
                        这里适合{" "}
                        <span className="font-extrabold text-[#f5a300]">
                          认真记录
                        </span>{" "}
                        每一次陪伴
                      </p>
                      <p className="mt-1 truncate text-[#6f6258]">
                        也把有用经验留给后来的人
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-14 hidden rotate-12 xl:block">
                <div className="space-y-2">
                  <span className="block h-[5px] w-10 rounded-full bg-[#f5c233]" />
                  <span className="block h-[5px] w-16 rounded-full bg-[#f5c233]/90" />
                  <span className="block h-[5px] w-7 rounded-full bg-[#f5c233]/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="discover" className="-mt-6 bg-white rounded-[44px] overflow-hidden z-[1000] relative">
          <div className="mx-auto w-full max-w-[1520px] px-4 pb-16 sm:px-6 xl:px-10">
            <div className="rounded-[44px]  px-4 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-6 xl:px-8 xl:py-10">
              <div>
                <div>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[22px]">🐾</span>
                        <h2 className="text-[24px] font-black tracking-[-0.04em] text-[#1f140f] sm:text-[32px]">
                          社区新鲜事
                        </h2>
                      </div>
                      <p className="mt-3 text-[14px] text-[#8f8379] sm:text-[16px]">
                        来自真实用户的最新动态，内容会从社区接口实时更新。
                      </p>
                    </div>

                    <Link
                      href="/content"
                      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#8f8379] transition hover:text-[#2e1a14]"
                    >
                      查看全部
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {topics.map((topic, index) => (
                      <button
                        key={topic}
                        className={`h-10 rounded-full px-5 text-[15px] font-medium transition ${
                          index === 0
                            ? "bg-[#f5d87d] text-[#2e1a14] shadow-[0_10px_20px_rgba(245,194,51,0.2)]"
                            : "bg-[#f6f5f3] text-[#90857a] hover:bg-[#efece7]"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <HomeDiscoverList />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
