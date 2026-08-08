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
   * Webhook post bisa terpicu sebelum slug-nya ditulis (draft yang baru
   * dibuat, misalnya), dan entri yang hilang itu tidak boleh meninggalkan
   * `/berita/undefined` telanjang di daftar revalidasi.
   */
  it("drops the article path when the post has no slug yet", () => {
    expect(pathsFor({ _type: "post" })).toEqual(["/berita", "/prestasi", "/"]);
  });

  it("revalidates /pemerintah-kelurahan for a staffMember", () => {
    expect(pathsFor({ _type: "staffMember" })).toEqual([
      "/pemerintah-kelurahan",
    ]);
  });

  // /peta juga: umkm dengan `location` dirender sebagai pin peta, jadi
  // kedua halaman menampilkan dokumen yang sama dan keduanya harus di-bust.
  it("revalidates /umkm and /peta for an umkm", () => {
    expect(pathsFor({ _type: "umkm" })).toEqual(["/umkm", "/peta"]);
  });

  it("revalidates /peta for a place", () => {
    expect(pathsFor({ _type: "place" })).toEqual(["/peta"]);
  });

  /**
   * Header dan Footer membaca siteSettings dan muncul di tiap halaman,
   * jadi satu path halaman saja tidak cukup — ini harus kembali sebagai
   * layout sentinel, yang oleh route dipetakan ke
   * revalidatePath("/", "layout").
   */
  it("returns the layout sentinel for siteSettings, not a page path", () => {
    expect(pathsFor({ _type: "siteSettings" })).toEqual([LAYOUT_SENTINEL]);
  });

  it("returns nothing for an unrecognised type", () => {
    expect(pathsFor({ _type: "somethingElse" })).toEqual([]);
  });

  it("returns nothing when _type is missing entirely", () => {
    expect(pathsFor({})).toEqual([]);
  });
});
