import type { ImageLoaderProps } from "next/image";

/**
 * Loader gambar global, disambungkan lewat `images.loaderFile` di
 * next.config.ts.
 *
 * Harus global, bukan prop `loader`: next/image adalah Client Component,
 * dan function tidak bisa dilewatkan dari server component ke client component.
 *
 * Berjalan untuk semua gambar. PNG statis di public/images/ tidak bisa
 * diresize, jadi dikembalikan apa adanya — tetap perlu prop `unoptimized`
 * di `<Image>`-nya supaya Next melewati loader ini sepenuhnya.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  // Aset lokal/statis: tidak ada CDN untuk meresize-nya, jadi kembalikan path apa adanya.
  if (!src.startsWith("https://cdn.sanity.io/")) return src;

  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  // auto=format menyajikan WebP/AVIF kalau didukung; fit=max tidak pernah
  // memperbesar melebihi ukuran aslinya.
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
}
