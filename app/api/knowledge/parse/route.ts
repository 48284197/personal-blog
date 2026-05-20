import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const parseKnowledgeSchema = z.object({
  url: z.string().url(),
})

type ParsedMeta = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  likeCount?: string
  collectCount?: string
  commentCount?: string
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function cleanMetaContent(value?: string) {
  if (!value) return ''
  return decodeHtmlEntities(value.replace(/[`“”]/g, '').replace(/\s+/g, ' ').trim())
}

function extractMetaContent(html: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escapedKey}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escapedKey}["'][^>]*>`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    const content = cleanMetaContent(match?.[1])
    if (content) return content
  }

  return ''
}

function extractTitle(html: string) {
  return cleanMetaContent(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
}

function normalizeXiaohongshuTitle(title: string) {
  return title.replace(/\s*-\s*小红书\s*$/i, '').trim()
}

function extractHashTags(description: string) {
  return Array.from(new Set(description.match(/#[^#\s]+/g)?.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean) ?? []))
}

function inferPlatform(url: string, siteName?: string) {
  const normalizedUrl = url.toLowerCase()
  const normalizedSite = siteName?.toLowerCase() ?? ''
  if (normalizedUrl.includes('xiaohongshu.com') || normalizedUrl.includes('xhslink.com') || normalizedSite.includes('小红书')) return 'xiaohongshu'
  if (normalizedUrl.includes('douyin.com')) return 'douyin'
  if (normalizedUrl.includes('zhihu.com')) return 'zhihu'
  if (normalizedUrl.includes('bilibili.com') || normalizedUrl.includes('b23.tv')) return 'bilibili'
  if (normalizedUrl.includes('weixin.qq.com')) return 'wechat'
  if (normalizedUrl.includes('weibo.com')) return 'weibo'
  if (normalizedUrl.includes('kuaishou.com')) return 'kuaishou'
  if (normalizedUrl.includes('toutiao.com')) return 'toutiao'
  if (normalizedUrl.includes('baijiahao.baidu.com')) return 'baijiahao'
  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) return 'youtube'
  if (normalizedUrl.includes('tiktok.com')) return 'tiktok'
  return 'other'
}

function buildContent(meta: ParsedMeta) {
  const stats = [
    meta.likeCount ? `点赞：${meta.likeCount}` : '',
    meta.collectCount ? `收藏：${meta.collectCount}` : '',
    meta.commentCount ? `评论：${meta.commentCount}` : '',
  ].filter(Boolean)

  return [
    meta.description,
    stats.length ? `原平台互动数据：${stats.join(' · ')}` : '',
  ].filter(Boolean).join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const parsed = parseKnowledgeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ message: '请输入有效链接' }, { status: 400 })
    }

    const response = await fetch(parsed.data.url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json({ message: `解析失败，原网页返回 ${response.status}` }, { status: 502 })
    }

    const html = await response.text()
    const meta: ParsedMeta = {
      title: extractMetaContent(html, 'og:title') || extractTitle(html),
      description: extractMetaContent(html, 'description') || extractMetaContent(html, 'og:description'),
      image: extractMetaContent(html, 'og:image'),
      url: extractMetaContent(html, 'og:url') || response.url || parsed.data.url,
      type: extractMetaContent(html, 'og:type'),
      siteName: extractMetaContent(html, 'og:site_name'),
      likeCount: extractMetaContent(html, 'og:xhs:note_like'),
      collectCount: extractMetaContent(html, 'og:xhs:note_collect'),
      commentCount: extractMetaContent(html, 'og:xhs:note_comment'),
    }

    const normalizedTitle = meta.title ? normalizeXiaohongshuTitle(meta.title) : ''
    const tags = extractHashTags(meta.description ?? '')
    const sourcePlatform = inferPlatform(meta.url || parsed.data.url, meta.siteName)
    const summary = meta.description || normalizedTitle

    return NextResponse.json({
      sourceUrl: meta.url || parsed.data.url,
      sourcePlatform,
      sourceTitle: normalizedTitle,
      sourceCoverUrl: meta.image ?? '',
      title: normalizedTitle,
      summary,
      content: buildContent(meta),
      tags,
      sourceAuthorName: meta.siteName || (sourcePlatform === 'xiaohongshu' ? '小红书作者' : '原平台作者'),
      raw: meta,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '解析链接失败，请稍后重试。' },
      { status: 500 }
    )
  }
}
