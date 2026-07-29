import { groq } from "next-sanity";

/**
 * Every image needs real pixel dimensions (so <Image> can reserve space and
 * avoid layout shift) and the LQIP blur placeholder. Defined once and
 * interpolated into each query rather than retyped per field.
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
    kelurahanMapImage${imageFields},
    contactEmail,
    contactWhatsapp,
    googleMapsUrl,
    instagramUrl,
    tiktokUrl
  }
`;

/** Public places for /peta — no images, just name + category + maps link. */
export const placesQuery = groq`
  *[_type == "place"] | order(name asc){
    _id,
    name,
    category,
    googleMapsUrl
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
    googleMapsUrl
  }
`;

/**
 * Prestasi and Berita are the same `post` type split by `category`.
 * `publishedAt` drives both the card date and the year grouping — there is
 * deliberately no separate `date` field.
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

/** Fields every post card needs, shared by the list, homepage and prestasi. */
const postCardFields = groq`
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage${imageFields}
`;

/**
 * The Berita filter, shared by the list and its count so the two can never
 * disagree about how many results exist — a mismatch there would show page
 * links that lead to empty grids.
 *
 * `$q` is a match pattern from `toMatchPattern` in src/lib/search.ts, or null
 * when the reader isn't searching: `!defined($q)` then short-circuits the rest
 * away, so one query serves both cases instead of two that drift apart.
 *
 * Title *and* excerpt, because someone searching "kebersihan" expects to find
 * "Kerja Bakti", where the word only appears in the summary.
 */
const beritaFilter = groq`
  _type == "post" && category == "berita" &&
  (!defined($q) || title match $q || excerpt match $q)
`;

/**
 * One page of Berita. $start/$end come from the ?page= param, $q from ?q=.
 * Both are parameters, never interpolated — nothing a reader types can alter
 * the shape of the query.
 */
export const beritaListQuery = groq`
  *[${beritaFilter}] | order(publishedAt desc) [$start...$end]{
    ${postCardFields}
  }
`;

export const beritaCountQuery = groq`
  count(*[${beritaFilter}])
`;

/** The three newest Berita, for the homepage. */
export const latestPostsQuery = groq`
  *[_type == "post" && category == "berita"] | order(publishedAt desc) [0...3]{
    ${postCardFields}
  }
`;

/**
 * Deliberately NOT filtered by category: /berita/[slug] is the shared article
 * route, and PrestasiCard links into it too. Filtering here would 404 every
 * Prestasi article.
 */
export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0]{
    ${postCardFields},
    category,
    body,
    images[]${imageFields}
  }
`;

/** Every slug, both categories — drives generateStaticParams. */
export const allPostSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)].slug.current
`;

/**
 * Same documents as allPostSlugsQuery, but sitemap.xml also wants a
 * `lastModified` per entry — hence `_updatedAt` (last edit) rather than
 * `publishedAt` (the editable display date, which can be backdated).
 */
export const sitemapPostsQuery = groq`
  *[_type == "post" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }
`;
