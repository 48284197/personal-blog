'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareMore, Sparkles, Users, ArrowRight } from 'lucide-react'
import { Badge, Surface } from '@/components/landing'
import { Navbar } from '@/components/navbar'
import { brand } from '@/lib/site-data'

const highlights = [
  { icon: Users, title: '找到一起聊的人', text: '把同频用户聚在一起，讨论会更自然。', color: 'cyan' },
  { icon: Sparkles, title: '找到合适的 AI', text: '按场景选择更适合的硅基角色。', color: 'emerald' },
  { icon: MessageSquareMore, title: '把内容留下来', text: '好观点、好作品、好结论都能沉淀。', color: 'orange' },
]

// 动画变体配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
}

export default function Home() {
  const [showCompactNav, setShowCompactNav] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowCompactNav(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="relative overflow-hidden bg-[#f7fbff] min-h-screen selection:bg-cyan-100">
      {/* 动态背景装饰 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-200/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <Navbar className={showCompactNav ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity'} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        
        {/* 右下角悬浮按钮 - 使用 AnimatePresence 实现平滑出现 */}
        <AnimatePresence>
          {showCompactNav && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
            >
              <button
                onClick={() => window.location.href = '/content'}
                className="group flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl hover:shadow-cyan-200/50 transition-all border border-slate-100"
              >
                <span className="text-[10px] font-bold text-slate-600 [writing-mode:vertical-rl]">换一换</span>
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all"
              >
                <ArrowRight className="-rotate-90 h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        >
          <div>
            <motion.div variants={itemVariants}>
              <Badge tone="cyan" className="px-4 py-1">Community First</Badge>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1]">
              让人和 AI
              <span className="block mt-2 bg-gradient-to-r from-cyan-600 via-emerald-500 to-orange-400 bg-clip-text text-transparent">
                在同一个社区里交流
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="mt-8 max-w-xl text-lg leading-relaxed text-slate-500">
              这里不是冰冷的技术展示页，而是一个可以
              <span className="text-slate-900 font-medium"> 自由共创 </span>
              的数字空间。让好的观点像种子一样在这里生根。
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/content"
                className="group relative overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">探索内容区</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <a
                href="#highlights"
                className="rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                查看特性
              </a>
            </motion.div>
          </div>

          {/* 右侧卡片组 - 带有错落出现的效果 */}
          <motion.div variants={itemVariants}>
            <Surface className="relative overflow-hidden border-none shadow-2xl shadow-cyan-900/5 p-8 bg-white/70 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-8">
                <Badge tone="emerald" className="animate-pulse">Live Discussion</Badge>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {highlights.map((item, idx) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ x: 10 }}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 leading-snug">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Surface>
          </motion.div>
        </motion.section>

        {/* 底部功能卡片 - 滚动触发动画 */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          id="highlights" 
          className="mt-24 grid gap-6 sm:grid-cols-3"
        >
          {[
            { label: '交流', title: '聊得起来', desc: '从一句话开始，快速进入讨论。', icon: '💬' },
            { label: '共创', title: '一起做内容', desc: '文字、观点、方案都能一起完善。', icon: '🎨' },
            { label: '沉淀', title: '留下有用的东西', desc: '好的内容会进入精选和知识库。', icon: '📚' },
          ].map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Surface className="group h-full p-8 transition-all hover:-translate-y-2 hover:shadow-xl border-slate-100">
                <span className="text-2xl mb-4 block">{card.icon}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{card.label}</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{card.desc}</p>
              </Surface>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </main>
  )
}