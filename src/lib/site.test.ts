import { describe, expect, it } from "vitest";
import { normalizeSiteUrl } from "./site";

/**
 * These cases are not hypothetical. `VERCEL_PROJECT_PRODUCTION_URL` was once
 * set by hand *with* the protocol, which produced `https://https://…` in every
 * <loc> in sitemap.xml. Nothing threw and every page still rendered — the links
 * were simply all invalid. A silent failure like that is worth a test.
 */
describe("normalizeSiteUrl", () => {
  it("adds a protocol to the bare hostname Vercel supplies", () => {
    expect(normalizeSiteUrl("portal-kelurahan-sidoharjo.vercel.app")).toBe(
      "https://portal-kelurahan-sidoharjo.vercel.app",
    );
  });

  it("leaves an address that already has one alone", () => {
    expect(normalizeSiteUrl("https://sidoharjo.go.id")).toBe(
      "https://sidoharjo.go.id",
    );
  });

  it("does not double up the protocol", () => {
    expect(normalizeSiteUrl("https://sidoharjo.go.id")).not.toContain(
      "https://https://",
    );
  });

  it("keeps http, so localhost isn't rewritten to https", () => {
    expect(normalizeSiteUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  // siteUrl is always joined to a path beginning with "/", so a stored trailing
  // slash would yield https://site//berita.
  it("strips trailing slashes", () => {
    expect(normalizeSiteUrl("https://sidoharjo.go.id/")).toBe(
      "https://sidoharjo.go.id",
    );
    expect(normalizeSiteUrl("https://sidoharjo.go.id///")).toBe(
      "https://sidoharjo.go.id",
    );
  });

  it("ignores surrounding whitespace from a hand-edited .env", () => {
    expect(normalizeSiteUrl("  https://sidoharjo.go.id  ")).toBe(
      "https://sidoharjo.go.id",
    );
  });
});
