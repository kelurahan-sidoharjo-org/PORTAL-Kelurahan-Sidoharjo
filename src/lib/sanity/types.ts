/**
 * Hand-written result types for the queries in queries.ts.
 *
 * Not generated: TypeGen would add a codegen step to every schema edit, which
 * is a poor trade at this size. If the content model grows a lot, revisit.
 */

export interface SanityImageAsset {
  _id: string;
  metadata: {
    dimensions: { width: number; height: number };
    /** Tiny base64 preview Sanity generates for us — used as a blur placeholder. */
    lqip: string;
  };
}

export interface SanityImage {
  asset: SanityImageAsset | null;
  alt?: string;
}

export interface SiteSettings {
  villageName: string;
  heroVideoUrl: string | null;
  officeImage: SanityImage | null;
  orgChartImage: SanityImage | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}

/**
 * A `geopoint` as /peta needs it. Sanity stores an optional `alt` (altitude)
 * too; nothing here reads it, so the queries never ask for it.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * The `place.category` enum — drives the map marker (emoji + colour) and the
 * legend row. Order here is only documentation; `PLACE_CATEGORIES` in
 * src/lib/places.ts owns the order things render in.
 */
export type PlaceCategory =
  | "pemerintahan"
  | "ibadah"
  | "sekolah"
  | "kesehatan"
  | "toko"
  | "pertanian"
  | "perkebunan"
  | "kandang"
  | "industri"
  | "jasa"
  | "wisata"
  | "landmark"
  | "lainnya";

export interface Place {
  _id: string;
  name: string;
  category: PlaceCategory;
  googleMapsUrl: string;
  /** Optional: a place with no point simply gets no pin. */
  location: GeoPoint | null;
}

export interface StaffMember {
  _id: string;
  name: string;
  position: string;
  photo: SanityImage | null;
}

export interface Umkm {
  _id: string;
  businessName: string;
  description: string | null;
  photo: SanityImage | null;
  contactUrl: string | null;
  googleMapsUrl: string | null;
  /** Optional, same as Place — UMKM with a point also appear on /peta. */
  location: GeoPoint | null;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt: string | null;
  coverImage: SanityImage | null;
}

/**
 * A full article. Serves both categories — /berita/[slug] is the shared
 * article route, linked to from Prestasi cards as well as Berita ones.
 */
export interface PostDetail extends PostSummary {
  category: "berita" | "prestasi";
  /** Portable Text; shape is owned by @portabletext/react, not us. */
  body: PortableTextBlock[] | null;
  images: SanityImage[] | null;
}

/** Minimal structural type — avoids a dependency just for a block shape. */
export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}
