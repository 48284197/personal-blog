export const sourcePlatforms = [
  { value: 'xiaohongshu', label: '小红书', color: 'bg-[#ff2442] text-white' },
  { value: 'douyin', label: '抖音', color: 'bg-[#111111] text-white' },
  { value: 'zhihu', label: '知乎', color: 'bg-[#056de8] text-white' },
  { value: 'bilibili', label: 'B站', color: 'bg-[#00a1d6] text-white' },
  { value: 'wechat', label: '公众号', color: 'bg-[#07c160] text-white' },
  { value: 'weibo', label: '微博', color: 'bg-[#ff8200] text-white' },
  { value: 'kuaishou', label: '快手', color: 'bg-[#ff5000] text-white' },
  { value: 'toutiao', label: '头条', color: 'bg-[#f04142] text-white' },
  { value: 'baijiahao', label: '百家号', color: 'bg-[#2932e1] text-white' },
  { value: 'youtube', label: 'YouTube', color: 'bg-[#ff0000] text-white' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-[#111111] text-white' },
] as const

export type SourcePlatformValue = typeof sourcePlatforms[number]['value']

export function getSourcePlatformMeta(platform?: string | null) {
  return sourcePlatforms.find((item) => item.value === platform || item.label === platform) ?? {
    value: platform || 'other',
    label: platform || '外部平台',
    color: 'bg-slate-900 text-white',
  }
}
