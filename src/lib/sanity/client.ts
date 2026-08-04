import { createClient } from "next-sanity";
import type { QueryParams } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  /**
   * Reads happen at build and revalidation rather than per visitor, so the CDN
   * saves almost nothing here — while costing correctness. When the publish
   * webhook fires, Sanity's CDN can still be holding the pre-publish answer, so
   * the page rebuilds with the *old* content and then sits on it for the full
   * hour. Nothing errors; staff just see their edit not appear.
   *
   * Going straight to the API removes that. `sanityFetch` below is what keeps
   * the extra traffic off Sanity's rate limits.
   */
  useCdn: false,
  perspective: "published",
});

/** Kept in step with `export const revalidate` on the pages. */
const REVALIDATE_SECONDS = 3600;

/**
 * Read Sanity through this, not through `client.fetch` directly.
 *
 * With the CDN off, every read hits Sanity's main API, which is rate-limited
 * far more tightly. Next's Data Cache absorbs it: the same query is fetched
 * once an hour no matter how often it's asked for. That matters most on
 * /berita, which reads `searchParams` and therefore can't be prerendered — it
 * renders per request, taking Header and Footer along with it.
 */
export function sanityFetch<T>(query: string, params: QueryParams = {}) {
  return client.fetch<T>(query, params, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}
