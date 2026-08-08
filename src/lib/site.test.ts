import { describe, expect, it } from "vitest";
import { normalizeSiteUrl } from "./site";

/**
 * Kasus-kasus ini bukan andaian. `VERCEL_PROJECT_PRODUCTION_URL` pernah
 * disetel manual *dengan* protokolnya, yang menghasilkan `https://https://…`
 * di setiap <loc> di sitemap.xml. Tidak ada yang error dan tiap halaman
 * tetap render — tautannya cuma semuanya tidak valid. Kegagalan diam-diam
 * seperti itu layak diberi tes.
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

  // siteUrl selalu digabung dengan path yang diawali "/", jadi trailing
  // slash yang tersimpan akan menghasilkan https://site//berita.
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
