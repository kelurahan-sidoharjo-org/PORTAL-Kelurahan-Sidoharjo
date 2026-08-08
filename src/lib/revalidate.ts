export interface WebhookBody {
  _type?: string;
  slug?: { current?: string } | string;
}

/** Dilewatkan ke revalidatePath("/", "layout") menggantikan path sungguhan. */
export const LAYOUT_SENTINEL = "__layout__";

export function slugOf(body: WebhookBody): string | null {
  if (typeof body.slug === "string") return body.slug;
  return body.slug?.current ?? null;
}

/** Halaman mana saja yang menampilkan document type tertentu. */
export function pathsFor(body: WebhookBody): string[] {
  switch (body._type) {
    case "post": {
      const slug = slugOf(body);
      // Kedua halaman daftar: kategorinya mungkin berubah, atau ini bisa
      // jadi post prestasi, dan beranda membawa tiga yang terbaru.
      return [
        ...(slug ? [`/berita/${slug}`] : []),
        "/berita",
        "/prestasi",
        "/",
      ];
    }
    case "staffMember":
      return ["/pemerintah-kelurahan"];
    case "umkm":
      // /peta juga: umkm dengan `location` adalah pin di peta, jadi
      // mengedit satu berarti harus menyegarkan kedua halaman atau peta
      // tetap menyimpan titik lama untuk sisa jam ISR itu.
      return ["/umkm", "/peta"];
    case "place":
      return ["/peta"];
    case "siteSettings":
      // Header dan Footer membaca siteSettings dan muncul di tiap halaman.
      return [LAYOUT_SENTINEL];
    default:
      return [];
  }
}
