/**
 * Turns a raw `?q=` value into a GROQ `match` pattern.
 *
 * Unlike /peta — where every place is already in the browser and `filterPlaces`
 * can do a plain substring match — /berita only ever holds one page of posts,
 * so the search has to happen in Sanity. GROQ's `match` works on whole words,
 * which would make "kebersih" find nothing; a trailing `*` on each word turns
 * it back into the "starts typing and it narrows" behaviour readers expect.
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
    // `*` is GROQ's own wildcard. Stripping it stops a stray asterisk from
    // widening the search instead of narrowing it.
    .replace(/\*/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;
  return words.map((word) => `${word}*`).join(" ");
}

/** The raw text to put back in the search box, so the query stays visible. */
export function searchValue(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ?? "";
}
