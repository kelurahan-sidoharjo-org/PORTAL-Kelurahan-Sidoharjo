/**
 * Cost guardrails, not usability ones.
 *
 * Every distinct `?q=` value is its own Next Data Cache key, and every new key
 * means two live reads against Sanity's main API — the CDN is deliberately off
 * (see client.ts). Unbounded, a trivial script can drain the Sanity quota until
 * revalidation stops, and the only symptom staff ever see is that a published
 * berita never appears. No error, nothing to report.
 *
 * 60 characters / 6 words sits far above any real search (readers type one to
 * three words). Cutting mid-word costs nothing: the trailing wildcard still
 * matches it as a prefix, so "kebersihan" truncated to "kebersih" finds the
 * same article.
 */
const MAX_LENGTH = 60;
const MAX_WORDS = 6;

/**
 * Turns a raw `?q=` value into a GROQ `match` pattern.
 *
 * Unlike /peta — where every place is already in the browser and `filterPlaces`
 * can do a plain substring match — /berita only ever holds one page of posts,
 * so the search has to happen in Sanity. GROQ's `match` works on whole words,
 * which would make "kebersih" find nothing; a trailing `*` on each word turns
 * it back into the "starts typing and it narrows" behaviour readers expect.
 *
 * The output is also a *canonical* form, so searches that differ only in
 * spelling-of-the-same-thing share one cache entry instead of each paying for
 * its own pair of Sanity reads. All three normalisations below were verified
 * result-neutral against the production dataset on 2026-08-08: `match` ignores
 * case, ignores word order, and ignores repeated words, so none of them can
 * change which articles come back.
 *
 * Returns null when there's nothing to search for, which the queries read as
 * "no filter" — see `!defined($q)` in queries.ts.
 */
export function toMatchPattern(
  raw: string | string[] | undefined,
): string | null {
  // `?q=a&q=b` arrives as an array. Take the first rather than 404ing: a
  // malformed search should still show results, unlike a malformed page number.
  const value = Array.isArray(raw) ? raw[0] : raw;

  const words = (value ?? "")
    .slice(0, MAX_LENGTH)
    // `match` is already case-insensitive, so this changes no result — it only
    // folds "Kerja", "kerja" and "KERJA" onto one cache key.
    .toLowerCase()
    // `*` is GROQ's own wildcard. Stripping it stops a stray asterisk from
    // widening the search instead of narrowing it.
    .replace(/\*/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Unique words, sorted: `match` requires every term to be present regardless
  // of the order they were typed in, so every permutation of a search collapses
  // to the same pattern — and therefore the same cache entry.
  const canonical = [...new Set(words)].sort().slice(0, MAX_WORDS);

  if (canonical.length === 0) return null;
  return canonical.map((word) => `${word}*`).join(" ");
}

/** The raw text to put back in the search box, so the query stays visible. */
export function searchValue(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ?? "";
}
