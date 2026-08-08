import { describe, expect, it } from "vitest";
import { getPageInfo, parsePageParam, POSTS_PER_PAGE } from "./pagination";

describe("parsePageParam", () => {
  it("defaults to page 1 when absent", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("parses a valid page number", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  /**
   * Ini datang langsung dari URL, jadi tidak bisa dipercaya. Mengembalikan
   * null membuat halaman 404 alih-alih diam-diam menyajikan halaman 1 untuk
   * tautan yang salah.
   */
  it.each([
    ["zero", "0"],
    ["negative", "-2"],
    ["fractional", "1.5"],
    ["text", "abc"],
    ["empty", ""],
    ["repeated param", ["1", "2"] as string[]],
  ])("rejects %s", (_label, input) => {
    expect(parsePageParam(input)).toBeNull();
  });
});

describe("getPageInfo", () => {
  it("slices the first page from the start", () => {
    const info = getPageInfo(1, 30);
    expect(info.start).toBe(0);
    expect(info.end).toBe(POSTS_PER_PAGE);
    expect(info.hasPrev).toBe(false);
    expect(info.hasNext).toBe(true);
  });

  it("offsets later pages", () => {
    const info = getPageInfo(3, 30, 12);
    expect(info.start).toBe(24);
    expect(info.end).toBe(36);
  });

  it("counts total pages, rounding a partial page up", () => {
    expect(getPageInfo(1, 25, 12).totalPages).toBe(3);
    expect(getPageInfo(1, 24, 12).totalPages).toBe(2);
  });

  it("marks the last page as having no next", () => {
    const info = getPageInfo(3, 25, 12);
    expect(info.hasPrev).toBe(true);
    expect(info.hasNext).toBe(false);
  });

  it("reports one page when there are no posts at all", () => {
    const info = getPageInfo(1, 0);
    expect(info.totalPages).toBe(1);
    expect(info.hasPrev).toBe(false);
    expect(info.hasNext).toBe(false);
  });
});
