import { describe, expect, it } from "vitest";
import { parseCoordinates } from "./parseCoordinates";

const SIDOHARJO = { lat: -7.8179, lng: 111.0704 };

describe("parseCoordinates", () => {
  describe("bare coordinate pairs", () => {
    it("reads a comma-separated pair", () => {
      expect(parseCoordinates("-7.8179, 111.0704")).toEqual(SIDOHARJO);
    });

    it("reads a pair with no space", () => {
      expect(parseCoordinates("-7.8179,111.0704")).toEqual(SIDOHARJO);
    });

    it("reads a space-separated pair", () => {
      expect(parseCoordinates("-7.8179 111.0704")).toEqual(SIDOHARJO);
    });

    it("ignores surrounding whitespace", () => {
      expect(parseCoordinates("   -7.8179, 111.0704  ")).toEqual(SIDOHARJO);
    });

    it("accepts whole numbers", () => {
      expect(parseCoordinates("-7, 111")).toEqual({ lat: -7, lng: 111 });
    });
  });

  describe("Google Maps URLs", () => {
    it("reads the ?q= coordinate form", () => {
      expect(
        parseCoordinates("https://www.google.com/maps?q=-7.8179,111.0704"),
      ).toEqual(SIDOHARJO);
    });

    it("reads the @ viewport form", () => {
      expect(
        parseCoordinates("https://www.google.com/maps/@-7.8179,111.0704,17z"),
      ).toEqual(SIDOHARJO);
    });

    it("prefers the !3d/!4d pin over the @ viewport centre", () => {
      // Pasangan @ adalah tempat kamera berada; !3d/!4d adalah lokasi
      // sebenarnya. URL yang membawa keduanya harus mengarah ke lokasinya,
      // bukan ke kameranya.
      const url =
        "https://www.google.com/maps/place/Kantor/@-7.9000,111.9000,17z/data=!3m1!4b1!4m5!3m4!8m2!3d-7.8179!4d111.0704";
      expect(parseCoordinates(url)).toEqual(SIDOHARJO);
    });
  });

  describe("rejects what it cannot read", () => {
    it("returns null for empty or whitespace input", () => {
      expect(parseCoordinates("")).toBeNull();
      expect(parseCoordinates("   ")).toBeNull();
    });

    it("returns null for a name search URL with no coordinates", () => {
      expect(
        parseCoordinates("https://www.google.com/maps?q=Kantor+Kelurahan+Sidoharjo"),
      ).toBeNull();
    });

    it("returns null for a maps.app.goo.gl short link", () => {
      // Sama sekali tidak mengandung koordinat — meng-resolve-nya butuh
      // request jaringan, yang sengaja tidak dilakukan di sini.
      expect(parseCoordinates("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
    });

    it("returns null for a transposed pair (longitude in the latitude slot)", () => {
      // 111 bukan lintang yang valid — ini kesalahan tempel yang paling
      // sering terjadi.
      expect(parseCoordinates("111.0704, -7.8179")).toBeNull();
    });

    it("returns null for out-of-range values", () => {
      expect(parseCoordinates("-91, 111")).toBeNull();
      expect(parseCoordinates("-7.8, 181")).toBeNull();
    });

    it("returns null for a single number", () => {
      expect(parseCoordinates("-7.8179")).toBeNull();
    });

    it("returns null for trailing junk rather than half-reading it", () => {
      expect(parseCoordinates("-7.8179, 111.0704 dan seterusnya")).toBeNull();
    });

    it("returns null for plain text", () => {
      expect(parseCoordinates("Kantor Kelurahan Sidoharjo")).toBeNull();
    });
  });
});
