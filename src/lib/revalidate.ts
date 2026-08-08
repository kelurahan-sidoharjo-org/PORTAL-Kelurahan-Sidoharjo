export interface WebhookBody {
  _type?: string;
  slug?: { current?: string } | string;
}

/** Passed to revalidatePath("/", "layout") instead of a real path. */
export const LAYOUT_SENTINEL = "__layout__";

export function slugOf(body: WebhookBody): string | null {
  if (typeof body.slug === "string") return body.slug;
  return body.slug?.current ?? null;
}

/** Which pages show a given document type. */
export function pathsFor(body: WebhookBody): string[] {
  switch (body._type) {
    case "post": {
      const slug = slugOf(body);
      // Both list pages: category may have changed, or this may be a prestasi
      // post, and the homepage carries the three latest.
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
      // Also /peta: an umkm with a `location` is a pin on the map, so editing
      // one has to refresh both pages or the map keeps the old point for the
      // rest of the ISR hour.
      return ["/umkm", "/peta"];
    case "place":
      return ["/peta"];
    case "siteSettings":
      // Header and Footer read siteSettings and appear on every page.
      return [LAYOUT_SENTINEL];
    default:
      return [];
  }
}
