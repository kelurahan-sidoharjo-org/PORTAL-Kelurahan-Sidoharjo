import type { GeoPoint, Place, PlaceCategory, Umkm } from "@/lib/sanity/types";

/**
 * Bentuk marker di /peta. Tiap jenis pin — 13 nilai `place.category` plus
 * UMKM — melewati satu tabel ini, supaya swatch legenda, pin peta, dan
 * tooltip tidak pernah saling bertentangan.
 *
 * Emoji membawa makna; warna cuma penguat. Sebagian besar nilai dari
 * `patik-map-website`, acuan peta ini.
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
  // Patik memberi kandang warna yang sama dengan landmark, jadi keduanya
  // tidak bisa dibedakan di peta. Sengaja dipindah.
  kandang: { emoji: "🐔", color: "#a16207" },
  industri: { emoji: "🔧", color: "#64748b" },
  jasa: { emoji: "📋", color: "#d946ef" },
  wisata: { emoji: "🏞️", color: "#0ea5e9" },
  landmark: { emoji: "📍", color: "#ea580c" },
  lainnya: { emoji: "🏷️", color: "#404040" },
  umkm: { emoji: "🍜", color: "#f59e0b" },
};

/**
 * Kategori dalam urutan tampil legenda: "pemerintahan → perdagangan →
 * lahan → landmark", kategori serba-guna di akhir. `umkm` sengaja tidak
 * di sini — ia document type terpisah, bukan `place.category`.
 * `MARKER_CATEGORIES` di bawah daftar lengkapnya.
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

/** Setiap jenis pin, urutan legenda: tempat dulu, baru UMKM. */
export const MARKER_CATEGORIES: readonly MarkerCategory[] = [
  ...PLACE_CATEGORIES,
  "umkm",
];

/** Titik tengah Sidoharjo, dari batas wilayah di
 * public/geojson/batas-kelurahan.geojson, bukan tebakan. Cuma jalan
 * terakhir — begitu ada batas wilayah atau pin, peta fit ke situ. */
export const SIDOHARJO_CENTER: GeoPoint = { lat: -7.8173, lng: 111.0708 };

/** "pemerintahan" → "Pemerintahan". Semuanya kapitalisasi bersih, tidak
 * perlu tabel lookup. */
export function categoryLabel(category: MarkerCategory): string {
  return category === "umkm"
    ? "UMKM"
    : category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Satu hal untuk digambar di peta. `place` dan `umkm` punya field beda;
 * semua yang mengalir dari `toMapPins` bekerja di atas satu bentuk ini saja.
 */
export interface MapPin {
  id: string;
  name: string;
  category: MarkerCategory;
  location: GeoPoint;
  googleMapsUrl: string;
}

/** Fallback URL Google Maps dari koordinat — dipakai saat UMKM punya
 * titik tapi tidak punya tautan sendiri. `place.googleMapsUrl` wajib
 * diisi, jadi cuma UMKM yang butuh ini. */
function mapsUrlForPoint({ lat, lng }: GeoPoint): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Menyempitkan geopoint yang kosong/terisi separuh jadi titik yang bisa
 * dipakai. Sanity bisa menyimpan `{lat: 5}` tanpa `lng` kalau patch
 * terputus, dan satu NaN cukup membuat Leaflet error saat fit bounds. */
function usablePoint(location: GeoPoint | null | undefined): GeoPoint | null {
  if (!location) return null;
  const { lat, lng } = location;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/**
 * Kedua document type, diratakan jadi satu daftar yang digambar peta.
 * Yang tidak punya titik dibuang di sini, bukan dijaga di tiap langkah
 * berikutnya.
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
 * Baris legenda mana yang ditampilkan: cuma kategori yang punya pin,
 * urutan MARKER_CATEGORIES supaya stabil. Tanpa ini legenda terbuka
 * dengan 14 baris, kebanyakan nol.
 */
export function presentCategories(pins: MapPin[]): MarkerCategory[] {
  return MARKER_CATEGORIES.filter((category) =>
    pins.some((pin) => pin.category === category),
  );
}

/** Berapa banyak pin per kategori, untuk angka di sebelah tiap baris legenda. */
export function countByCategory(pins: MapPin[]): Map<MarkerCategory, number> {
  const counts = new Map<MarkerCategory, number>();
  for (const pin of pins) {
    counts.set(pin.category, (counts.get(pin.category) ?? 0) + 1);
  }
  return counts;
}

/**
 * Menyempitkan pin berdasarkan toggle legenda dan pencarian nama. `hidden`
 * menyimpan kategori yang dimatikan — set kosong berarti semua tampil.
 * Substring case-insensitive pada nama; kedua kondisi digabung AND.
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

/** Urutan bounds Leaflet: [[south, west], [north, east]]. */
export type Bounds = [[number, number], [number, number]];

/**
 * Kotak terkecil yang memuat tiap pin, null untuk daftar kosong —
 * pemanggilnya jatuh balik ke batas wilayah, lalu SIDOHARJO_CENTER. Satu
 * pin menghasilkan kotak berluas nol; Leaflet menanganinya sendiri
 * dengan memusatkan di maxZoom.
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
