/**
 * Konstanta konfigurasi, sengaja bebas efek samping. Dipisah dari
 * client.ts supaya mengimpor helper gambar tidak ikut membangun Sanity
 * client — kalau tidak, apa pun yang menyentuh gambar tidak bisa dipakai
 * di test.
 */
/**
 * Dicek, bukan dipaksa `!`. `!` menjanjikan nilai yang tidak diverifikasi
 * apa pun, jadi clone baru tanpa `.env.local` gagal belakangan dengan
 * URL CDN rusak, bukan di sini dengan pesan yang bisa diperbaiki.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Locally: copy .env.local.example to .env.local and ` +
        `fill it in. On Vercel: Project → Settings → Environment Variables.`,
    );
  }
  return value;
}

export const projectId = requireEnv(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/**
 * Dikunci supaya perubahan API Sanity tidak diam-diam mengubah hasil
 * query. Harus sama dengan sanity.config.ts dan
 * sanity/assetSources/resizeUploadAssetSource.tsx.
 */
export const apiVersion = process.env.SANITY_API_VERSION || "2024-01-01";
