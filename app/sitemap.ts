import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let activityUrls: MetadataRoute.Sitemap = [];

  try {
    const activities = await prisma.activity.findMany({
      where: { isOpen: true },
      select: { slug: true, createdAt: true },
    });
    activityUrls = activities.map((a) => ({
      url: `https://careaigent.be/activiteiten/${a.slug}`,
      lastModified: a.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available during build — return static pages only
  }

  return [
    {
      url: 'https://careaigent.be/',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://careaigent.be/agenda',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://careaigent.be/resultaten',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://careaigent.be/team',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...activityUrls,
  ];
}
