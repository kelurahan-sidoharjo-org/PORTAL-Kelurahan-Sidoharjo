import { describe, expect, it } from "vitest";
import { LAYOUT_SENTINEL, pathsFor, slugOf } from "./revalidate";

describe("slugOf", () => {
  it("reads a plain string slug", () => {
    expect(slugOf({ slug: "kerja-bakti" })).toBe("kerja-bakti");
  });

  it("reads a Sanity slug object", () => {
    expect(slugOf({ slug: { current: "kerja-bakti" } })).toBe("kerja-bakti");
  });

  it("returns null when there is no slug", () => {
    expect(slugOf({})).toBeNull();
    expect(slugOf({ slug: {} })).toBeNull();
  });
});

describe("pathsFor", () => {
  it("revalidates the article, both list pages, and the homepage for a post", () => {
    expect(pathsFor({ _type: "post", slug: "kerja-bakti" })).toEqual([
      "/berita/kerja-bakti",
      "/berita",
      "/prestasi",
      "/",
    ]);
  });

  /**
   * A post webhook can fire before the slug is written (a brand-new draft,
   * say), and the missing entry must not leave a bare `/berita/undefined` in
   * the revalidation list.
   */
  it("drops the article path when the post has no slug yet", () => {
    expect(pathsFor({ _type: "post" })).toEqual(["/berita", "/prestasi", "/"]);
  });

  it("revalidates /pemerintah-kelurahan for a staffMember", () => {
    expect(pathsFor({ _type: "staffMember" })).toEqual([
      "/pemerintah-kelurahan",
    ]);
  });

  it("revalidates /umkm for an umkm", () => {
    expect(pathsFor({ _type: "umkm" })).toEqual(["/umkm"]);
  });

  it("revalidates /peta for a place", () => {
    expect(pathsFor({ _type: "place" })).toEqual(["/peta"]);
  });

  /**
   * Header and Footer read siteSettings and appear on every page, so a single
   * page path isn't enough — this must come back as the layout sentinel, which
   * the route maps to revalidatePath("/", "layout").
   */
  it("returns the layout sentinel for siteSettings, not a page path", () => {
    expect(pathsFor({ _type: "siteSettings" })).toEqual([LAYOUT_SENTINEL]);
  });

  /**
   * demographicStat is a registered schema type with no mapped page yet
   * (Phase 6 isn't built). Falling through to an empty array is what makes the
   * route reply 200 with revalidated: false instead of throwing — pin that as
   * today's intentional behaviour.
   */
  it("returns nothing for demographicStat", () => {
    expect(pathsFor({ _type: "demographicStat" })).toEqual([]);
  });

  it("returns nothing for an unrecognised type", () => {
    expect(pathsFor({ _type: "somethingElse" })).toEqual([]);
  });

  it("returns nothing when _type is missing entirely", () => {
    expect(pathsFor({})).toEqual([]);
  });
});
