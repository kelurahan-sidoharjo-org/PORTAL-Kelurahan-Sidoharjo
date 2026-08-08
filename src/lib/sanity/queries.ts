import { groq } from "next-sanity";

/**
 * Tiap gambar butuh dimensi piksel asli (untuk <Image>, hindari layout
 * shift) dan placeholder blur LQIP. Didefinisikan sekali, diinterpolasi
 * ke tiap query.
 */
const imageFields = groq`{
  ...,
  asset->{ _id, metadata { dimensions, lqip } }
}`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    villageName,
    heroVideoUrl,
    officeImage${imageFields},
    orgChartImage${imageFields},
    contactEmail,
    contactWhatsapp,
    googleMapsUrl,
    instagramUrl,
    tiktokUrl
  }
`;

/**
 * Place publik untuk /peta — tanpa gambar, cuma yang dibutuhkan pin peta.
 * `location` diproyeksikan datar (lat/lng saja) supaya cocok dengan
 * `GeoPoint`; geopoint utuh akan ikut menyeret `_type`/`alt` yang tidak dipakai.
 */
export const placesQuery = groq`
  *[_type == "place"] | order(name asc){
    _id,
    name,
    category,
    googleMapsUrl,
    location{ lat, lng }
  }
`;

export const staffMembersQuery = groq`
  *[_type == "staffMember"] | order(order asc){
    _id,
    name,
    position,
    photo${imageFields}
  }
`;

export const umkmListQuery = groq`
  *[_type == "umkm"] | order(businessName asc){
    _id,
    businessName,
    description,
    photo${imageFields},
    contactUrl,
    googleMapsUrl,
    location{ lat, lng }
  }
`;

/**
 * Prestasi dan Berita adalah `post` type sama, dipisah lewat `category`.
 * `publishedAt` mengatur tanggal kartu dan pengelompokan tahun — sengaja
 * tidak ada field `date` terpisah.
 */
export const prestasiListQuery = groq`
  *[_type == "post" && category == "prestasi"] | order(publishedAt desc){
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    coverImage${imageFields}
  }
`;

/** Field kartu post, dipakai bersama daftar, beranda, dan prestasi. */
const postCardFields = groq`
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage${imageFields}
`;

/**
 * Filter Berita, dipakai bersama daftar dan hitungannya supaya keduanya
 * tidak pernah berbeda jumlah hasil — kalau beda, tautan halaman bisa
 * mengarah ke grid kosong.
 *
 * `$q` adalah pola match dari `toMatchPattern`, atau null saat tidak
 * sedang mencari — `!defined($q)` lalu short-circuit sisanya.
 *
 * Judul *dan* excerpt, karena pencarian "kebersihan" harus menemukan
 * "Kerja Bakti" walau kata itu cuma ada di ringkasan.
 */
const beritaFilter = groq`
  _type == "post" && category == "berita" &&
  (!defined($q) || title match $q || excerpt match $q)
`;

/**
 * Satu halaman Berita. $start/$end dari ?page=, $q dari ?q=. Keduanya
 * parameter, tidak pernah diinterpolasi.
 */
export const beritaListQuery = groq`
  *[${beritaFilter}] | order(publishedAt desc) [$start...$end]{
    ${postCardFields}
  }
`;

export const beritaCountQuery = groq`
  count(*[${beritaFilter}])
`;

/** Tiga Berita terbaru untuk beranda. */
export const latestPostsQuery = groq`
  *[_type == "post" && category == "berita"] | order(publishedAt desc) [0...3]{
    ${postCardFields}
  }
`;

/**
 * Sengaja TIDAK difilter category: /berita/[slug] adalah route artikel
 * bersama, PrestasiCard juga menautkan ke situ. Memfilter akan 404 setiap
 * artikel Prestasi.
 *
 * Juga mencocokkan `previousSlugs`, supaya alamat lama tetap menemukan
 * artikelnya — halamannya lalu redirect ke alamat terbaru. Tanpa ini,
 * memperbaiki typo judul akan 404-kan tautan yang sudah dibagikan.
 * `defined()` eksplisit karena artikel lama tidak punya field ini.
 */
export const postBySlugQuery = groq`
  *[_type == "post" && (
    slug.current == $slug ||
    (defined(previousSlugs) && $slug in previousSlugs)
  )][0]{
    ${postCardFields},
    category,
    body,
    images[]${imageFields}
  }
`;

/** Setiap slug, kedua kategori — untuk generateStaticParams. */
export const allPostSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)].slug.current
`;

/**
 * Sama dengan allPostSlugsQuery, tapi sitemap.xml juga butuh
 * `lastModified` — karena itu `_updatedAt` (edit terakhir), bukan
 * `publishedAt` (tanggal tampil yang bisa dimundurkan).
 */
export const sitemapPostsQuery = groq`
  *[_type == "post" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }
`;
