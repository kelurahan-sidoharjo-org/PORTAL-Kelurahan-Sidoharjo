import { describe, expect, it } from "vitest";
import {
  boundsOf,
  categoryLabel,
  countByCategory,
  filterPins,
  MARKER_CATEGORIES,
  PLACE_CATEGORIES,
  PLACE_CATEGORY_MARKERS,
  presentCategories,
  toMapPins,
  type MapPin,
} from "./places";
import type { Place, Umkm } from "@/lib/sanity/types";

/** Factory place minimal — hanya field yang disentuh logika peta. */
function place(
  name: string,
  category: Place["category"],
  location: Place["location"] = { lat: -7.8, lng: 111.0 },
): Place {
  return { _id: name, name, category, googleMapsUrl: "https://maps.example", location };
}

function umkm(
  businessName: string,
  overrides: Partial<Umkm> = {},
): Umkm {
  return {
    _id: businessName,
    businessName,
    description: null,
    photo: null,
    contactUrl: null,
    googleMapsUrl: null,
    location: { lat: -7.8, lng: 111.0 },
    ...overrides,
  };
}

const places: Place[] = [
  place("SD Negeri 01", "sekolah"),
  place("SMP Negeri 02", "sekolah"),
  place("Masjid Al-Ikhlas", "ibadah"),
  place("Kantor Kelurahan", "pemerintahan"),
];

describe("PLACE_CATEGORY_MARKERS", () => {
  it("has an entry for every PlaceCategory and for umkm", () => {
    for (const category of MARKER_CATEGORIES) {
      expect(PLACE_CATEGORY_MARKERS[category]).toBeDefined();
    }
    // Kategori yang ada di skema tapi tidak ada di sini akan gagal diam-diam
    // saat render — Leaflet cuma tidak menggambar pin — jadi ini penjaganya.
    expect(MARKER_CATEGORIES).toEqual([...PLACE_CATEGORIES, "umkm"]);
  });
});

describe("categoryLabel", () => {
  it("capitalises the category, keeping the full word", () => {
    expect(categoryLabel("pemerintahan")).toBe("Pemerintahan");
    expect(categoryLabel("toko")).toBe("Toko");
  });

  it("special-cases umkm to the acronym", () => {
    expect(categoryLabel("umkm")).toBe("UMKM");
  });
});

describe("toMapPins", () => {
  it("drops places and umkm with no location", () => {
    const noPoint = place("Tanpa Titik", "lainnya", null);
    expect(toMapPins([noPoint])).toEqual([]);

    const businessNoPoint = umkm("Tanpa Titik", { location: null });
    expect(toMapPins([], [businessNoPoint])).toEqual([]);
  });

  it("drops a half-filled geopoint (one coordinate missing)", () => {
    const broken = place("Rusak", "lainnya", {
      lat: 5,
      lng: Number.NaN,
    });
    expect(toMapPins([broken])).toEqual([]);
  });

  it("carries place fields through as a MapPin", () => {
    const [pin] = toMapPins([places[0]]);
    expect(pin).toMatchObject({
      id: "SD Negeri 01",
      name: "SD Negeri 01",
      category: "sekolah",
      googleMapsUrl: "https://maps.example",
      location: { lat: -7.8, lng: 111.0 },
    });
  });

  it("tags umkm pins with category 'umkm'", () => {
    const business = umkm("Warung Bu Sri", {
      googleMapsUrl: "https://maps.example/warung",
    });
    const [pin] = toMapPins([], [business]);
    expect(pin.category).toBe("umkm");
    expect(pin.googleMapsUrl).toBe("https://maps.example/warung");
  });

  it("builds a coordinate-based Google Maps link for umkm missing one", () => {
    const business = umkm("Kopi Bubuk", {
      googleMapsUrl: null,
      location: { lat: -7.85, lng: 111.06 },
    });
    const [pin] = toMapPins([], [business]);
    expect(pin.googleMapsUrl).toBe("https://www.google.com/maps?q=-7.85,111.06");
  });
});

describe("presentCategories", () => {
  it("returns only categories that appear, in fixed order", () => {
    const pins = toMapPins(places);
    // sekolah + ibadah muncul sebelum pemerintahan sesuai PLACE_CATEGORIES.
    expect(presentCategories(pins)).toEqual(["pemerintahan", "ibadah", "sekolah"]);
  });

  it("returns an empty array for no pins", () => {
    expect(presentCategories([])).toEqual([]);
  });

  it("includes umkm when a business pin is present", () => {
    const pins = toMapPins([], [umkm("Warung Bu Sri")]);
    expect(presentCategories(pins)).toEqual(["umkm"]);
  });
});

describe("countByCategory", () => {
  it("counts pins per category", () => {
    const counts = countByCategory(toMapPins(places));
    expect(counts.get("sekolah")).toBe(2);
    expect(counts.get("ibadah")).toBe(1);
    expect(counts.get("pemerintahan")).toBe(1);
    expect(counts.get("toko")).toBeUndefined();
  });
});

describe("filterPins", () => {
  const pins = toMapPins(places);

  it("returns everything with no query and nothing hidden", () => {
    expect(filterPins(pins, { query: "", hidden: new Set() })).toHaveLength(4);
  });

  it("drops pins whose category is hidden", () => {
    const result = filterPins(pins, { query: "", hidden: new Set(["sekolah"]) });
    expect(result.map((p) => p.name)).toEqual(["Masjid Al-Ikhlas", "Kantor Kelurahan"]);
  });

  it("matches the name case-insensitively as a substring", () => {
    const result = filterPins(pins, { query: "masjid", hidden: new Set() });
    expect(result.map((p) => p.name)).toEqual(["Masjid Al-Ikhlas"]);
  });

  it("ignores surrounding whitespace in the query", () => {
    const result = filterPins(pins, { query: "  negeri ", hidden: new Set() });
    expect(result).toHaveLength(2);
  });

  it("combines the query and hidden set with AND", () => {
    const result = filterPins(pins, {
      query: "negeri",
      hidden: new Set(["sekolah"]),
    });
    expect(result).toEqual([]);
  });

  it("can hide multiple categories at once", () => {
    const result = filterPins(pins, {
      query: "",
      hidden: new Set(["sekolah", "ibadah"]),
    });
    expect(result.map((p) => p.name)).toEqual(["Kantor Kelurahan"]);
  });
});

describe("boundsOf", () => {
  function pin(lat: number, lng: number): MapPin {
    return {
      id: `${lat},${lng}`,
      name: "x",
      category: "lainnya",
      location: { lat, lng },
      googleMapsUrl: "https://maps.example",
    };
  }

  it("returns null for an empty list", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("returns a zero-area box for a single pin", () => {
    expect(boundsOf([pin(-7.8, 111.0)])).toEqual([
      [-7.8, 111.0],
      [-7.8, 111.0],
    ]);
  });

  it("returns the enclosing box for several pins", () => {
    const bounds = boundsOf([pin(-7.8, 111.0), pin(-7.9, 111.2), pin(-7.7, 111.1)]);
    expect(bounds).toEqual([
      [-7.9, 111.0],
      [-7.7, 111.2],
    ]);
  });
});
