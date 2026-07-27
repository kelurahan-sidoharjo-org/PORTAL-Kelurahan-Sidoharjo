/**
 * The site's own absolute URL — needed by anything that produces a link a
 * *different* machine will follow: `metadataBase`, Open Graph images,
 * sitemap.xml, robots.txt. Relative paths are fine inside the browser but
 * useless to WhatsApp or Googlebot, which read the page from outside.
 *
 * Resolved here once so the .go.id cutover is a single env-var edit rather than
 * a find-and-replace.
 *
 * Three rungs, each covering a case the one above can't:
 *   1. NEXT_PUBLIC_SITE_URL — set by hand; always wins. This is what changes
 *      when the real domain lands.
 *   2. Vercel's own value — injected automatically into every build, so a
 *      deploy that forgot rung 1 still advertises a real address instead of
 *      localhost. Supplied as a bare hostname, hence the https:// prefix here.
 *      It's the *production* URL even on preview deploys, which is what
 *      canonical/OG links want; VERCEL_URL is per-deployment and would churn.
 *   3. Local `npm run dev`, where neither of the above exists.
 *
 * `||` rather than `??`, matching env.ts: a variable saved with an empty value
 * in the Vercel dashboard should fall through to the next rung, not win it and
 * hand `new URL("")` an empty string to throw on.
 *
 * Rung 2 has no NEXT_PUBLIC_ prefix, so it exists only on the server. That's
 * fine — every consumer is server-side metadata generation. Don't reach for
 * `siteUrl` from a client component; there it would silently be localhost.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Open Graph `siteName`, and the suffix in the page-title template. */
export const siteName = "Portal Kelurahan Sidoharjo";

export const siteDescription =
  "Situs resmi Kelurahan Sidoharjo, Kecamatan Sidoharjo, Kabupaten Wonogiri. " +
  "Berita, prestasi, UMKM lokal, peta tempat publik, dan informasi kantor kelurahan.";
