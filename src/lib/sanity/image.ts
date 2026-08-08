import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "./env";
import type { SanityImage } from "./types";

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * URL dasar CDN untuk sebuah gambar Sanity, belum ada parameter ukuran yang
 * diterapkan — parameter resize-nya ditambahkan oleh loader global di
 * imageLoader.ts.
 */
export function urlFor(source: SanityImage) {
  return builder.image(source);
}

/**
 * Semua yang dibutuhkan komponen untuk merender gambar Sanity tanpa
 * layout shift. Mengembalikan null kalau field-nya kosong.
 *
 * Sengaja tanpa `loader` di sini — dikonfigurasi global di next.config.ts,
 * karena prop function tidak bisa melewati batas server/client.
 */
export function imageProps(image: SanityImage | null | undefined) {
  if (!image?.asset) return null;
  const { dimensions, lqip } = image.asset.metadata;
  return {
    src: urlFor(image).url(),
    width: dimensions.width,
    height: dimensions.height,
    blurDataURL: lqip,
    placeholder: "blur" as const,
  };
}

/**
 * Sama, minus width/height — untuk <Image fill>, di mana gambar meregang
 * mengisi parent yang sudah punya ukuran dan Next menolak dimensi eksplisit.
 */
export function imageFillProps(image: SanityImage | null | undefined) {
  const props = imageProps(image);
  if (!props) return null;
  const { width: _w, height: _h, ...rest } = props;
  void _w;
  void _h;
  return rest;
}
