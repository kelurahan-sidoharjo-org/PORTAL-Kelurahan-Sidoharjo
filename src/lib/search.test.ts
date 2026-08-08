import { describe, expect, it } from "vitest";
import { searchValue, toMatchPattern } from "./search";

describe("toMatchPattern", () => {
  /**
   * null is the "no filter" signal the queries branch on (`!defined($q)`).
   * If an empty box returned "" or "*" instead, /berita would either error or
   * quietly stop showing posts — so every flavour of empty is pinned here.
   */
  it("returns null for anything that isn't a search", () => {
    expect(toMatchPattern(undefined)).toBeNull();
    expect(toMatchPattern("")).toBeNull();
    expect(toMatchPattern("   ")).toBeNull();
  });

  /**
   * The whole reason this function exists: GROQ's `match` works on whole
   * words, so "kebersih" would find nothing in an article about "kebersihan".
   * The trailing * is what restores the partial matching readers expect from
   * the /peta search.
   */
  it("appends a wildcard so partial words still match", () => {
    expect(toMatchPattern("kebersih")).toBe("kebersih*");
  });

  /** Words come back sorted — see the canonical-form tests further down. */
  it("wildcards every word, not just the last", () => {
    expect(toMatchPattern("kerja bakti")).toBe("bakti* kerja*");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(toMatchPattern("  kerja   bakti  ")).toBe("bakti* kerja*");
  });

  /**
   * `*` is GROQ's own wildcard. Left in, a reader typing it would widen their
   * search instead of narrowing it — the opposite of what a search box is for.
   */
  it("strips wildcards the reader typed", () => {
    expect(toMatchPattern("*kerja*")).toBe("kerja*");
    expect(toMatchPattern("*")).toBeNull();
  });

  /**
   * `?q=a&q=b` arrives as an array. Unlike a bad page number — which 404s —
   * a malformed search should still show results rather than a dead end.
   */
  it("takes the first value when the param repeats", () => {
    expect(toMatchPattern(["kerja", "bakti"])).toBe("kerja*");
  });
});

/**
 * The pattern is a cache key as much as a filter: each distinct one costs two
 * live reads against Sanity's main API (the CDN is off — see client.ts). These
 * pin the two properties that keep that cost bounded.
 *
 * All three foldings are result-neutral — GROQ's `match` ignores case, word
 * order, and repeated words alike (verified against the production dataset,
 * 2026-08-08). So none of this narrows what a reader can find; it only stops
 * the same search from being paid for twice.
 */
describe("toMatchPattern — canonical form", () => {
  it("folds case, so KERJA and kerja share one cache entry", () => {
    expect(toMatchPattern("KERJA BAKTI")).toBe(toMatchPattern("kerja bakti"));
  });

  it("folds word order, so every permutation shares one cache entry", () => {
    expect(toMatchPattern("bakti kerja")).toBe(toMatchPattern("kerja bakti"));
  });

  it("folds repeated words, which add nothing to a `match`", () => {
    expect(toMatchPattern("kerja kerja bakti")).toBe(
      toMatchPattern("kerja bakti"),
    );
  });
});

describe("toMatchPattern — cost guardrails", () => {
  /**
   * Truncation is safe precisely because of the trailing wildcard: a word cut
   * in half still matches as a prefix, so the reader gets the article anyway.
   */
  it("truncates past 60 characters instead of passing it all to Sanity", () => {
    expect(toMatchPattern("kebersihan".repeat(20))).toBe(
      `${"kebersihan".repeat(6)}*`,
    );
  });

  it("keeps at most six words, so a wall of terms can't build a huge pattern", () => {
    // Sorted, so the six that survive are a…f rather than the six typed first.
    expect(toMatchPattern("a b c d e f g h i j")).toBe("a* b* c* d* e* f*");
  });

  /**
   * The shape of the actual abuse: a very long value, thrown at the endpoint
   * over and over. It must degrade to an ordinary small pattern, never throw
   * and never reach Sanity at full size.
   */
  it("survives a 10.000-character value", () => {
    const pattern = toMatchPattern("a".repeat(10_000));
    expect(pattern).toBe(`${"a".repeat(60)}*`);
  });
});

describe("searchValue", () => {
  /** Fed back into the input; without it the box empties itself on reload. */
  it("hands back the raw text, untouched", () => {
    expect(searchValue("kerja bakti")).toBe("kerja bakti");
    expect(searchValue(["kerja", "bakti"])).toBe("kerja");
  });

  it("is an empty string, never undefined, so the input stays controlled", () => {
    expect(searchValue(undefined)).toBe("");
  });
});
