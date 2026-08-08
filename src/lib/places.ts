import type { GeoPoint, Place, PlaceCategory, Umkm } from "@/lib/sanity/types";

/**
 * What a marker looks like on /peta. Every kind of pin — the thirteen
 * `place.category` values plus UMKM — resolves through this one table, so the
 * legend swatch, the map pin and the tooltip can never disagree.
 *
 * Emoji carry the meaning; colour is only reinforcement. Most values come
 * straight from `patik-map-website`, which this map is modelled on.
 */
export type MarkerCategory = PlaceCategory | "umkm";

export const PLACE_CATEGORY_MARKERS: Record<
  MarkerCategory,
  { emoji: string; color: string }
> = {
  pemerintahan: { emoji: "🏛️", color: "#1d4ed8" },
  ibadah: { emoji: "🕌", color: "#06b6d4" },
  sekolah: { emoji: "🏫", color: "#db2777" },
  kesehatan: { emoji: "⚕️", color: "#ef4444" },
  toko: { emoji: "🛒", color: "#8b5cf6" },
  pertanian: { emoji: "🌾", color: "#16a34a" },
  perkebunan: { emoji: "🌳", color: "#15803d" },
  // Patik gives kandang the same #ea580c as landmark, which makes the two
  // indistinguishable on the map. Moved off it deliberately.
  kandang: { emoji: "🐔", color: "#a16207" },
  industri: { emoji: "🔧", color: "#64748b" },
  jasa: { emoji: "📋", color: "#d946ef" },
  wisata: { emoji: "🏞️", color: "#0ea5e9" },
  landmark: { emoji: "📍", color: "#ea580c" },
  lainnya: { emoji: "🏷️", color: "#404040" },
  umkm: { emoji: "🍜", color: "#f59e0b" },
};

/**
 * The categories in the order their legend rows should appear. Roughly
 * "civic → commerce → land → landmarks", with the catch-all last so it never
 * sits between two real categories.
 *
 * `umkm` is absent on purpose: it is not a `place.category`, it comes from the
 * separate `umkm` document type. `MARKER_CATEGORIES` below is the full list.
 */
export const PLACE_CATEGORIES: readonly PlaceCategory[] = [
  "pemerintahan",
  "ibadah",
  "sekolah",
  "kesehatan",
  "toko",
  "pertanian",
  "perkebunan",
  "kandang",
  "industri",
  "jasa",
  "wisata",
  "landmark",
  "lainnya",
];

/** Every kind of pin, legend order: places first, then UMKM. */
export const MARKER_CATEGORIES: readonly MarkerCategory[] = [
  ...PLACE_CATEGORIES,
  "umkm",
];

/** Centre of Kelurahan Sidoharjo, Wonogiri — the midpoint of the boundary in
 * public/geojson/batas-kelurahan.geojson, not a guess from a place search.
 * Only used as a last resort: with any boundary or any pin loaded, the map
 * fits to that instead. */
export const SIDOHARJO_CENTER: GeoPoint = { lat: -7.8173, lng: 111.0708 };

/** "pemerintahan" → "Pemerintahan". All thirteen capitalise cleanly, so no
 * lookup table is needed. */
export function categoryLabel(category: MarkerCategory): string {
  return category === "umkm"
    ? "UMKM"
    : category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * One thing to draw on the map. `place` and `umkm` are different documents
 * with different field names; everything downstream of `toMapPins` works on
 * this shape alone and never has to care which it came from.
 */
export interface MapPin {
  id: string;
  name: string;
  category: MarkerCategory;
  location: GeoPoint;
  googleMapsUrl: string;
}

/** Google Maps has a documented URL for a bare coordinate — used when an UMKM
 * has a point but no link of its own, so clicking its pin always leads
 * somewhere. `place.googleMapsUrl` is required, so only UMKM need this. */
function mapsUrlForPoint({ lat, lng }: GeoPoint): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Narrow a geopoint that may be absent or half-filled down to a usable point.
 * Sanity can hold `{lat: 5}` with no `lng` if a patch was interrupted, and one
 * NaN coordinate is enough to make Leaflet throw while fitting bounds. */
function usablePoint(location: GeoPoint | null | undefined): GeoPoint | null {
  if (!location) return null;
  const { lat, lng } = location;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Both document types, flattened into the single list the map draws. Anything
 * without a usable point is dropped here rather than guarded at every later
 * step — a document with no location simply has no pin.
 */
export function toMapPins(places: Place[], umkm: Umkm[] = []): MapPin[] {
  const pins: MapPin[] = [];

  for (const place of places) {
    const location = usablePoint(place.location);
    if (!location) continue;
    pins.push({
      id: place._id,
      name: place.name,
      category: place.category,
      location,
      googleMapsUrl: place.googleMapsUrl,
    });
  }

  for (const business of umkm) {
    const location = usablePoint(business.location);
    if (!location) continue;
    pins.push({
      id: business._id,
      name: business.businessName,
      category: "umkm",
      location,
      googleMapsUrl: business.googleMapsUrl || mapsUrlForPoint(location),
    });
  }

  return pins;
}

/**
 * Which legend rows to show: only categories that actually have a pin, kept in
 * MARKER_CATEGORIES order so the legend is stable regardless of data order.
 * Without this the legend would open as fourteen rows, most of them zero.
 */
export function presentCategories(pins: MapPin[]): MarkerCategory[] {
  return MARKER_CATEGORIES.filter((category) =>
    pins.some((pin) => pin.category === category),
  );
}

/** How many pins per category, for the count beside each legend row. */
export function countByCategory(pins: MapPin[]): Map<MarkerCategory, number> {
  const counts = new Map<MarkerCategory, number>();
  for (const pin of pins) {
    counts.set(pin.category, (counts.get(pin.category) ?? 0) + 1);
  }
  return counts;
}

/**
 * Narrows the pins by the legend toggles and the name search. `hidden` holds
 * the categories switched *off* — an empty set means everything shows, which
 * is the state the page opens in. The search is a case-insensitive substring
 * match on the name. Both conditions combine with AND.
 */
export function filterPins(
  pins: MapPin[],
  { query, hidden }: { query: string; hidden: Set<MarkerCategory> },
): MapPin[] {
  const needle = query.trim().toLowerCase();
  return pins.filter(
    (pin) =>
      !hidden.has(pin.category) &&
      (!needle || pin.name.toLowerCase().includes(needle)),
  );
}

/** Leaflet's bounds order: [[south, west], [north, east]]. */
export type Bounds = [[number, number], [number, number]];

/**
 * The smallest box containing every pin, or null for an empty list — the
 * caller then falls back to the boundary layer, or to SIDOHARJO_CENTER.
 * A single pin yields a zero-area box, which Leaflet handles by centring on it
 * at maxZoom, so no special case is needed here.
 */
export function boundsOf(pins: MapPin[]): Bounds | null {
  if (pins.length === 0) return null;

  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;

  for (const { location } of pins) {
    south = Math.min(south, location.lat);
    north = Math.max(north, location.lat);
    west = Math.min(west, location.lng);
    east = Math.max(east, location.lng);
  }

  return [
    [south, west],
    [north, east],
  ];
}
