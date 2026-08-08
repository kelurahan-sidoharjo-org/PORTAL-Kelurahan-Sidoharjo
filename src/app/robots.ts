import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Disajikan di /robots.txt — instruksi untuk crawler mesin pencari, dan
 * bagaimana mereka menemukan sitemap-nya.
 *
 * Ini rambu, bukan gembok: crawler yang berperilaku baik mematuhinya,
 * tidak ada yang memaksakannya. Perlindungan sesungguhnya untuk Studio
 * adalah login Sanity, plus `noindex` di src/app/admin/layout.tsx. Ini
 * cuma menjaga /admin tetap keluar dari hasil pencarian.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api adalah webhook revalidasi — bukan halaman, tidak ada yang diindeks.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
