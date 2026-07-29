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

  it("wildcards every word, not just the last", () => {
    expect(toMatchPattern("kerja bakti")).toBe("kerja* bakti*");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(toMatchPattern("  kerja   bakti  ")).toBe("kerja* bakti*");
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
