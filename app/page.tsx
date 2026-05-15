import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  MessageSquare,
  Play,
  PawPrint,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { Navbar } from "@/components/navbar";

const topics = ["推荐", "关注", "狗狗", "猫咪", "小宠", "日常", "知识", "活动"];

const cards = [
  {
    title: "带柯基去公园玩耍的一天",
    image:
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80",
    author: "柯基小元气",
    likes: "1.2万",
    featured: true,
  },
  {
    title: "猫咪的迷惑行为大赏",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1f?auto=format&fit=crop&w=900&q=80",
    author: "喵喵酱",
    likes: "9823",
  },
  {
    title: "春天与你和毛孩子更配哦",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    author: "毛球妈妈",
    likes: "1.1万",
  },
  {
    title: "兔兔的可爱瞬间",
    image:
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=900&q=80",
    author: "软糯兔宝",
    likes: "6234",
  },
];

const sidebarItems = [
  {
    label: "分享萌宠日常",
    icon: MessageSquare,
    color: "text-[#f5a300] bg-[#fff1cc]",
  },
  {
    label: "结识同城宠友",
    icon: UsersRound,
    color: "text-[#f08c3f] bg-[#ffe5cf]",
  },
  {
    label: "参与有趣活动",
    icon: CalendarDays,
    color: "text-[#6a7cf3] bg-[#e8ecff]",
  },
];

function StatItem({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0c8] text-[#2e1a14] shadow-[0_8px_18px_rgba(245,194,51,0.14)]">
        {icon}
      </div>
      <div>
        <div className="text-[16px] font-extrabold leading-none text-[#2e1a14]">
          {value}
        </div>
        <div className="mt-1 text-[13px] text-[#7f736b]">{label}</div>
      </div>
    </div>
  );
}

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
                温暖有爱的宠物社区
              </p>

              <h1 className="max-w-[560px] text-[clamp(3rem,5.4vw,6.2rem)] font-black leading-[0.98] tracking-[-0.06em] text-[#2f1a12]">
                和有趣的人
                <br />
                分享萌宠生活
              </h1>

              <p className="mt-8 text-[18px] leading-8 text-[#65584f] sm:text-[20px]">
                毛球，温暖有爱的宠物社区
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/login?mode=register"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-[#f5c233] px-10 text-[17px] font-bold text-[#2e1a14] shadow-[0_12px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#efba18]"
                >
                  立即加入
                </Link>
                <Link
                  href="#discover"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-10 text-[17px] font-bold text-[#2e1a14] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:bg-[#faf8f4]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                  了解毛球
                </Link>
              </div>

              <div className="mt-14 flex flex-wrap gap-8 xl:gap-10">
                <StatItem
                  value="50万+"
                  label="宠物用户"
                  icon={<Users className="h-4 w-4" />}
                />
                <StatItem
                  value="200万+"
                  label="萌宠分享"
                  icon={<Heart className="h-4 w-4" />}
                />
                <StatItem
                  value="1000万+"
                  label="互动点赞"
                  icon={<Sparkles className="h-4 w-4" />}
                />
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
                        已有{" "}
                        <span className="font-extrabold text-[#f5a300]">
                          500,000+
                        </span>{" "}
                        毛孩子在这里
                      </p>
                      <p className="mt-1 truncate text-[#6f6258]">
                        找到属于他们的温暖家园
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
              <div className="grid gap-8 xl:grid-cols-[1fr_310px]">
                <div>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[22px]">🐾</span>
                        <h2 className="text-[24px] font-black tracking-[-0.04em] text-[#1f140f] sm:text-[32px]">
                          发现更多精彩
                        </h2>
                      </div>
                      <p className="mt-3 text-[14px] text-[#8f8379] sm:text-[16px]">
                        探索萌宠世界的无限乐趣
                      </p>
                    </div>

                    <Link
                      href="#"
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

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                      <article
                        key={card.title}
                        className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
                      >
                        <div className="relative h-[230px]">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                            unoptimized
                          />
                          {card.featured ? (
                            <div className="absolute left-3 top-3 rounded-full bg-[#f5c233] px-3 py-1 text-[12px] font-bold text-[#2e1a14] shadow-[0_10px_18px_rgba(245,194,51,0.22)]">
                              猫顶
                            </div>
                          ) : null}
                        </div>

                        <div className="px-4 pb-4 pt-4">
                          <h3 className="min-h-[36px] text-[17px] font-semibold  text-[#241711]">
                            {card.title}
                          </h3>
                          <div className="flex items-center justify-between text-[13px] text-[#8f8379]">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-[#cdb79f]" />
                              <span>{card.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{card.likes}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="rounded-[30px] border border-[#f3dfb7] bg-[linear-gradient(180deg,#fff9ea_0%,#fffdf8_100%)] px-6 py-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-2 text-[#2e1a14]">
                    <h3 className="text-[26px] font-black tracking-[-0.04em]">
                      加入毛球大家庭
                    </h3>
                    <span className="text-[22px]">🐾</span>
                  </div>

                  <p className="mt-4 text-[15px] leading-7 text-[#887c71]">
                    记录、分享、交流
                    <br />
                    让我们一起陪伴毛孩子成长
                  </p>

                  <Link
                    href="/login?mode=register"
                    className="mt-8 flex h-14 items-center justify-center rounded-full bg-[#f5c233] text-[17px] font-bold text-[#2e1a14] shadow-[0_12px_24px_rgba(245,194,51,0.28)] transition hover:bg-[#efba18]"
                  >
                    立即注册
                  </Link>

                  <div className="mt-6 space-y-3">
                    {sidebarItems.map(({ label, icon: Icon, color }) => (
                      <Link
                        key={label}
                        href="/login"
                        className="flex h-14 items-center rounded-full border border-black/5 bg-white px-4 text-[15px] font-medium text-[#2e1a14] shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:bg-[#faf8f4]"
                      >
                        <span
                          className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {label}
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
