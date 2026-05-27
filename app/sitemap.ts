import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = "https://maoqiu.space";

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes: SitemapEntry[] = [
  {
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${siteUrl}/content`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${siteUrl}/knowledge`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  },
  {
    url: `${siteUrl}/search`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${siteUrl}/login`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [publications, users] = await Promise.all([
      prisma.publication.findMany({
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 500,
        select: {
          id: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { updatedAt: "desc" },
        take: 500,
        select: {
          id: true,
          updatedAt: true,
        },
      }),
    ]);

    const publicationRoutes = publications.map((item): SitemapEntry => ({
      url: `${siteUrl}/content/${item.id}`,
      lastModified: item.updatedAt ?? item.publishedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const userRoutes = users.map((user): SitemapEntry => ({
      url: `${siteUrl}/user/${encodeURIComponent(user.id)}`,
      lastModified: user.updatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    }));

    return [
      ...staticRoutes,
      ...publicationRoutes,
      ...userRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
