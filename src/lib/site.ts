/**
 * URL absolut situs ini — dibutuhkan apa pun yang menghasilkan tautan
 * yang diikuti mesin *lain*: `metadataBase`, Open Graph, sitemap.xml,
 * robots.txt. Path relatif tidak berguna bagi WhatsApp atau Googlebot,
 * yang membaca halaman dari luar.
 *
 * Di-resolve di sini sekali, supaya cutover ke .go.id cukup satu env var.
 *
 * Tiga tingkat:
 *   1. NEXT_PUBLIC_SITE_URL — disetel manual; selalu menang. Berubah saat
 *      domain asli aktif.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — disetel Vercel sendiri tiap build,
 *      jadi deploy yang lupa tingkat 1 tetap mengiklankan alamat
 *      sungguhan. Ini URL *produksi* walau di preview deploy; VERCEL_URL
 *      beda per deployment dan terus berubah. **Jangan disetel manual.**
 *   3. `npm run dev` lokal, tidak satu pun di atas ada.
 *
 * Pakai `||`, bukan `??` (sama seperti env.ts): nilai kosong di dashboard
 * Vercel harus jatuh ke tingkat berikutnya, bukan memberi `new URL("")`
 * yang error.
 *
 * Tingkat 2 tanpa prefix NEXT_PUBLIC_, jadi hanya di server — semua
 * pemakainya metadata generation server-side. Jangan ambil `siteUrl` dari
 * client component; di situ diam-diam jadi localhost.
 */

/**
 * Vercel menyediakan tingkat 2 sebagai hostname telanjang, jadi
 * protokolnya harus ditambahkan — tapi orang yang menyetelnya manual
 * biasanya sudah menulis `https://…`, yang dulu menghasilkan
 * `https://https://…` dan diam-diam merusak tiap URL di sitemap.xml.
 * Menerima kedua bentuk menghilangkan jebakan itu; trailing slash
 * dibuang dengan alasan yang sama — `siteUrl` selalu digabung path yang
 * diawali `/`.
 *
 * Diekspor untuk unit test — bug di atas tidak terlihat di UI, jenis bug
 * yang layak diberi tes, bukan sekadar komentar.
 */
export function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

const configured =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const siteUrl = configured
  ? normalizeSiteUrl(configured)
  : "http://localhost:3000";

/** `siteName` Open Graph, dan sufiks di template judul halaman. */
export const siteName = "Portal Kelurahan Sidoharjo";

export const siteDescription =
  "Situs resmi Kelurahan Sidoharjo, Kecamatan Sidoharjo, Kabupaten Wonogiri. " +
  "Berita, prestasi, UMKM lokal, peta tempat publik, dan informasi kantor kelurahan.";
