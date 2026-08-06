import { createFileRoute } from '@tanstack/react-router'

const siteUrl = 'https://maoqiu.space'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            'User-agent: *',
            'Allow: /',
            'Disallow: /api/',
            'Disallow: /profile',
            'Disallow: /knowledge/create',
            `Sitemap: ${siteUrl}/sitemap.xml`,
            `Host: ${siteUrl}`,
            '',
          ].join('\n'),
          { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
        ),
    },
  },
})
