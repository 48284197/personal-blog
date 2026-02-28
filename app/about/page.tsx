const skills = [
  {
    category: '前端开发',
    color: 'cyan',
    items: [
      { name: 'React', level: 90, desc: 'Hooks / Next.js / RSC' },
      { name: 'Vue', level: 80, desc: 'Vue 3 / Composition API / Nuxt' },
      { name: 'TypeScript', level: 85, desc: '类型系统 / 泛型 / 工具类型' },
      { name: 'Tailwind CSS', level: 90, desc: '原子化 CSS / 响应式设计' },
    ],
  },
  {
    category: 'AI & Prompt',
    color: 'purple',
    items: [
      { name: 'Prompt 工程', level: 85, desc: '提示词设计 / 角色设定 / 思维链' },
      { name: 'AI 工作流', level: 80, desc: 'Claude / GPT / 多模态应用' },
      { name: 'RAG / Agent', level: 70, desc: '检索增强生成 / 自主智能体' },
    ],
  },
  {
    category: '产品设计',
    color: 'pink',
    items: [
      { name: '产品设计', level: 80, desc: '用户研究 / 需求分析 / PRD' },
      { name: 'UI/UX', level: 75, desc: '交互设计 / 视觉规范 / Figma' },
      { name: '全栈开发', level: 75, desc: 'Prisma / PostgreSQL / API 设计' },
    ],
  },
]

const timeline = [
  { year: '2024', event: '深入 AI 领域，专注 Prompt 工程与 AI 产品开发' },
  { year: '2023', event: '开始探索产品设计，从工程师视角理解用户体验' },
  { year: '2022', event: '全面转向 React + TypeScript，构建多个全栈项目' },
  { year: '2021', event: '学习 Vue 生态，参与前端工程化实践' },
  { year: '2020', event: '开始前端开发之旅，接触 HTML / CSS / JavaScript' },
]

const colorMap: Record<string, { bar: string; tag: string; border: string; text: string }> = {
  cyan: {
    bar: 'bg-cyan-500',
    tag: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
  },
  purple: {
    bar: 'bg-purple-500',
    tag: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
  },
  pink: {
    bar: 'bg-pink-500',
    tag: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-slate-100 relative overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,212,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(0,212,255,0.05),transparent)] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent)] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* ── Hero ── */}
          <section>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-mono text-slate-500 tracking-widest">// about.me</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold font-mono mb-4 leading-tight">
                  <span className="text-cyan-500">&gt;</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    你好，我是xuxiweii
                  </span>
                  <br />
                  <span className="text-white">一名全栈开发者</span>
                </h1>
                <p className="text-sm text-slate-400 font-mono leading-relaxed max-w-xl">
                  专注于前端工程、AI 应用与产品设计。热衷于探索技术与创意的交汇点，
                  用代码把想法变成现实。这里记录我的思考、实验和成长。
                </p>
              </div>

              {/* Status card */}
              <div className="shrink-0 bg-[#0e0e1a] border border-slate-800 p-4 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500/40" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-green-400">在线 · 接受合作</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono text-slate-500">
                  <div><span className="text-slate-700">role</span> <span className="text-cyan-400/80">Frontend Dev</span></div>
                  <div><span className="text-slate-700">focus</span> <span className="text-purple-400/80">AI + Product</span></div>
                  <div><span className="text-slate-700">mode</span> <span className="text-slate-400">builder</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Skills ── */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-slate-500 tracking-widest">// skills</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {skills.map((group) => {
                const c = colorMap[group.color]
                return (
                  <div key={group.category} className={`bg-[#0e0e1a] border ${c.border} relative p-5`}>
                    <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${c.border}`} />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${c.border}`} />
                    <div className={`text-xs font-mono ${c.text} tracking-widest mb-4`}>
                      [{group.category}]
                    </div>
                    <div className="space-y-4">
                      {group.items.map((skill) => (
                        <div key={skill.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-slate-300">{skill.name}</span>
                            <span className={`text-xs font-mono ${c.text} opacity-60`}>{skill.level}%</span>
                          </div>
                          <div className="h-px bg-slate-800 mb-1.5">
                            <div
                              className={`h-px ${c.bar} opacity-70`}
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <p className="text-xs font-mono text-slate-600">{skill.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Timeline ── */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-slate-500 tracking-widest">// timeline</span>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
            </div>
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-transparent" />
              <div className="space-y-6">
                {timeline.map((item, idx) => (
                  <div key={item.year} className="relative pl-6 group">
                    <div className="absolute left-0 top-1.5 w-2 h-2 border border-cyan-500/50 bg-[#080810] group-hover:border-cyan-400 transition-colors"
                      style={{ transform: 'translateX(-50%)' }} />
                    <div className="flex items-start gap-4">
                      <span className={`text-xs font-mono shrink-0 mt-0.5 ${idx === 0 ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {item.year}
                      </span>
                      <p className="text-xs font-mono text-slate-400 leading-relaxed">
                        {item.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Writing & Values ── */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-slate-500 tracking-widest">// writing</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '技术探索', desc: '分享前端、全栈开发的实践经验与踩坑记录', icon: '</>' },
                { label: 'AI 实验', desc: '记录 Prompt 设计、AI 工具使用与自动化工作流', icon: '∿' },
                { label: '产品思考', desc: '从工程师视角拆解产品逻辑与用户体验设计', icon: '⬡' },
                { label: '随笔杂谈', desc: '技术之外的阅读、思考与生活观察', icon: '~' },
              ].map((item) => (
                <div key={item.label} className="bg-[#0e0e1a] border border-slate-800/80 p-4 hover:border-cyan-500/30 transition-colors group relative">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/30 group-hover:border-cyan-400/60 transition-colors" />
                  <div className="flex items-start gap-3">
                    <span className="text-base font-mono text-slate-700 group-hover:text-cyan-600 transition-colors shrink-0 mt-0.5">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-xs font-mono text-slate-300 mb-1 group-hover:text-cyan-300 transition-colors">
                        {item.label}
                      </div>
                      <p className="text-xs font-mono text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Contact ── */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-mono text-slate-500 tracking-widest">// contact</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            <div className="bg-[#0e0e1a] border border-slate-800 p-6 relative">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/40" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/40" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-purple-500/40" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-500/40" />
              <p className="text-xs font-mono text-slate-500 mb-4">
                <span className="text-cyan-500">&gt;</span> 如果你有想法想聊，或对合作感兴趣，欢迎联系我
                <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-slate-800 bg-slate-900/50 text-xs font-mono text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                >
                  <span className="text-slate-600">$</span> GitHub
                </a>
                <a
                  href="mailto:hi@example.com"
                  className="flex items-center gap-2 px-4 py-2 border border-slate-800 bg-slate-900/50 text-xs font-mono text-slate-400 hover:border-purple-500/40 hover:text-purple-400 transition-all"
                >
                  <span className="text-slate-600">@</span> Email
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
