import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { sitemapPostsQuery } from "@/lib/sanity/queries";
import { siteUrl } from "@/lib/site";

/**
 * Served at /sitemap.xml — the table of contents handed to search engines so
 * they don't have to discover pages by crawling links. Matters most for berita:
 * without it a new post can go unnoticed for days.
 *
 * Matched to the pages' own ISR window so a new article shows up here on the
 * same schedule it shows up on /berita.
 */
export const revalidate = 3600;

/** Live routes only. /demografi is Phase 5 and would be a 404 in here. */
const staticPaths = [
  "/",
  "/berita",
  "/prestasi",
  "/peta",
  "/umkm",
  "/pemerintah-kelurahan",
];

interface SitemapPost {
  slug: string;
  _updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sanityFetch<SitemapPost[]>(sitemapPostsQuery);
  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      // The homepage is the entry point; the rest are equal peers below it.
      priority: path === "/" ? 1 : 0.8,
    })),
    // Both categories: /berita/[slug] is the shared article route, so Prestasi
    // articles live under /berita/ too. Filtering by category here would leave
    // every Prestasi article out of the sitemap.
    ...posts.map((post) => ({
      url: `${siteUrl}/berita/${post.slug}`,
      lastModified: new Date(post._updatedAt),
      priority: 0.6,
    })),
  ];
}