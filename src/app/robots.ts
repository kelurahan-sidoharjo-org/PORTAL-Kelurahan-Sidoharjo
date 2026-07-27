import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Served at /robots.txt — instructions for search engine crawlers, and how they
 * discover the sitemap.
 *
 * A sign, not a lock: well-behaved crawlers obey it, nothing enforces it. The
 * Studio's actual protection is the Sanity login, plus the `noindex` in
 * src/app/admin/layout.tsx. This just keeps /admin out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api is the revalidation webhook — not a page, nothing to index.
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
