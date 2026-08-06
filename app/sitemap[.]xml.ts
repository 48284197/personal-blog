import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/prisma'

const siteUrl = 'https://maoqiu.space'

type SitemapEntry = {
  url: string
  lastModified: Date
  changeFrequency: string
  priority: number
}

const staticRoutes: SitemapEntry[] = [
  { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${siteUrl}/content`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${siteUrl}/knowledge`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
  { url: `${siteUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
]

function toXml(entries: SitemapEntry[]) {
  const urls = entries.map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

async function getSitemapEntries() {
  try {
    const [publications, users] = await Promise.all([
      prisma.publication.findMany({
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 500,
        select: { id: true, updatedAt: true, publishedAt: true },
      }),
      prisma.user.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 500,
        select: { id: true, updatedAt: true },
      }),
    ])

    return [
      ...staticRoutes,
      ...publications.map((item): SitemapEntry => ({
        url: `${siteUrl}/content/${item.id}`,
        lastModified: item.updatedAt ?? item.publishedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })),
      ...users.map((user): SitemapEntry => ({
        url: `${siteUrl}/user/${encodeURIComponent(user.id)}`,
        lastModified: user.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.4,
      })),
    ]
  } catch {
    return staticRoutes
  }
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () =>
        new Response(toXml(await getSitemapEntries()), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        }),
    },
  },
})
