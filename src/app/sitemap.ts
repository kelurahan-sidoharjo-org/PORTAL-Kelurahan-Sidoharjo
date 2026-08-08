import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { sitemapPostsQuery } from "@/lib/sanity/queries";
import { siteUrl } from "@/lib/site";

/**
 * Disajikan di /sitemap.xml — daftar isi yang diberikan ke mesin pencari
 * supaya mereka tidak perlu menemukan halaman dengan meng-crawl tautan.
 * Paling penting untuk berita: tanpa ini post baru bisa tidak terlihat
 * selama berhari-hari.
 *
 * Disamakan dengan jendela ISR milik halamannya sendiri, supaya artikel
 * baru muncul di sini dengan jadwal yang sama dengan munculnya di /berita.
 */
export const revalidate = 3600;

/** Cuma route yang sudah hidup. /demografi adalah Phase 6 dan akan jadi 404 di sini. */
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
      // Beranda adalah titik masuk; sisanya jadi peer setara di bawahnya.
      priority: path === "/" ? 1 : 0.8,
    })),
    // Kedua kategori: /berita/[slug] adalah route artikel bersama, jadi
    // artikel Prestasi juga berada di bawah /berita/. Memfilter berdasarkan
    // category di sini akan membuang setiap artikel Prestasi dari sitemap.
    ...posts.map((post) => ({
      url: `${siteUrl}/berita/${post.slug}`,
      lastModified: new Date(post._updatedAt),
      priority: 0.6,
    })),
  ];
}