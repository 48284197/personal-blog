import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type SurfaceProps = {
  children: ReactNode
  className?: string
}

export function Surface({ children, className }: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-slate-200/60 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  )
}

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description: string
  align?: 'left' | 'center'
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.36em] text-teal-600/80">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  )
}

type BadgeProps = {
  children: ReactNode
  tone?: 'cyan' | 'orange' | 'emerald' | 'violet' | 'slate'
  className?: string
}

export function Badge({ children, tone = 'cyan', className }: BadgeProps) {
  const toneClasses = {
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

type MetricCardProps = {
  label: string
  value: string
  detail: string
  accent?: 'cyan' | 'orange' | 'emerald' | 'violet'
}

export function MetricCard({ label, value, detail, accent = 'cyan' }: MetricCardProps) {
  const accentClasses = {
    cyan: 'from-cyan-300/35 to-cyan-300/0',
    orange: 'from-orange-300/35 to-orange-300/0',
    emerald: 'from-emerald-300/35 to-emerald-300/0',
    violet: 'from-violet-300/35 to-violet-300/0',
  }

  return (
    <Surface className="relative overflow-hidden p-5">
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-px bg-gradient-to-r',
          accentClasses[accent]
        )}
      />
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-semibold text-slate-900">{value}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </Surface>
  )
}

type FeatureCardProps = {
  title: string
  summary: string
  items: string[]
  tone?: 'cyan' | 'orange' | 'emerald' | 'violet'
}

export function FeatureCard({ title, summary, items, tone = 'cyan' }: FeatureCardProps) {
  const edgeClasses = {
    cyan: 'border-cyan-400/20',
    orange: 'border-orange-400/20',
    emerald: 'border-emerald-400/20',
    violet: 'border-violet-400/20',
  }

  return (
    <Surface className={cn('p-6', edgeClasses[tone])}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <Badge tone={tone}>{tone}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p>
      <ul className="mt-5 space-y-3 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-6">
            <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current', {
              'text-cyan-300': tone === 'cyan',
              'text-orange-300': tone === 'orange',
              'text-emerald-300': tone === 'emerald',
              'text-violet-300': tone === 'violet',
            })} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Surface>
  )
}

type ModelCardProps = {
  name: string
  category: string
  summary: string
  strengths: string[]
  style: string
  useCase: string
}

export function ModelCard({ name, category, summary, strengths, style, useCase }: ModelCardProps) {
  return (
    <Surface className="overflow-hidden p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">{category}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{name}</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          收藏
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{summary}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {strengths.map((item) => (
          <Badge key={item} tone="slate">
            {item}
          </Badge>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">互动风格</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{style}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">适用场景</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{useCase}</p>
        </div>
      </div>
    </Surface>
  )
}

type TimelineCardProps = {
  phase: string
  title: string
  summary: string
}

export function TimelineCard({ phase, title, summary }: TimelineCardProps) {
  return (
    <Surface className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-sm font-semibold text-cyan-700">
          {phase}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
      </div>
    </Surface>
  )
}

type RouteCardProps = {
  route: string
  purpose: string
}

export function RouteCard({ route, purpose }: RouteCardProps) {
  return (
    <Surface className="p-5">
      <p className="font-mono text-sm text-cyan-700">{route}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{purpose}</p>
    </Surface>
  )
}

type StackCardProps = {
  title: string
  summary: string
  items: string[]
}

export function StackCard({ title, summary, items }: StackCardProps) {
  return (
    <Surface className="p-6">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="毛球" width={50} height={50} className="flex scale-90 items-center justify-center rounded-full object-contain" />
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{summary}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-6">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
