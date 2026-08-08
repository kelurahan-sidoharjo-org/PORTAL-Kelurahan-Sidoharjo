/**
 * Tipe hasil yang ditulis tangan untuk query di queries.ts.
 *
 * Tidak digenerate: TypeGen akan menambah langkah codegen di tiap edit
 * skema, yang jadi pertukaran buruk pada skala sebesar ini. Kalau model
 * kontennya berkembang jauh lebih besar, tinjau ulang keputusan ini.
 */

export interface SanityImageAsset {
  _id: string;
  metadata: {
    dimensions: { width: number; height: number };
    /** Preview base64 kecil yang digenerate Sanity untuk kita — dipakai sebagai blur placeholder. */
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
 * `geopoint` sebagaimana dibutuhkan /peta. Sanity juga menyimpan `alt`
 * (altitude) opsional; tidak ada yang membacanya di sini, jadi query tidak
 * pernah memintanya.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Enum `place.category` — menentukan marker peta (emoji + warna) dan baris
 * legenda. Urutan di sini cuma dokumentasi; `PLACE_CATEGORIES` di
 * src/lib/places.ts yang mengatur urutan tampilnya.
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
  /** Opsional: tempat tanpa titik lokasi sederhananya tidak punya pin. */
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
  /** Opsional, sama seperti Place — UMKM dengan titik lokasi juga muncul di /peta. */
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
 * Artikel lengkap. Melayani kedua kategori — /berita/[slug] adalah route
 * artikel bersama, ditautkan dari kartu Prestasi maupun Berita.
 */
export interface PostDetail extends PostSummary {
  category: "berita" | "prestasi";
  /** Portable Text; bentuknya dimiliki @portabletext/react, bukan kita. */
  body: PortableTextBlock[] | null;
  images: SanityImage[] | null;
}

/** Tipe struktural minimal — menghindari dependensi baru hanya untuk bentuk satu block. */
export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}
