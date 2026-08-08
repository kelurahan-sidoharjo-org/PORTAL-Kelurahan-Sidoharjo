/**
 * Dua basemap yang dipakai bareng di /peta publik dan picker lokasi Studio.
 *
 * Satelit saja kurang cocok untuk *menaruh* pin: cuma terlihat atap dan
 * pohon, tanpa jalan atau nama. Peta jalan menjawab "ini jalan apa";
 * citra satelit menjawab "ini bangunan yang mana". Dua layer terpisah,
 * bisa ditukar — bukan hybrid campuran, alasannya di bawah.
 *
 * Kedua sumber gratis, tanpa API key, anonim — lihat CLAUDE.md Phase 3.
 *
 * Ditaruh di sanity/, bukan src/lib/, karena sanity/ tidak punya alias
 * `@/` — peta publik bisa menjangkau turun ke path ini, Studio tidak bisa
 * menjangkau naik.
 */

export const ESRI_ATTRIBUTION =
  "&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Perhatikan urutan {z}/{y}/{x}: ArcGIS menaruh y sebelum x, beda dengan
 * {z}/{x}/{y} milik OSM. Tertukar, peta tetap tampil tapi menunjukkan
 * bagian dunia yang salah.
 */
export const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/**
 * Gaya standar OpenStreetMap. Sidoharjo sudah cukup lengkap dipetakan —
 * jalan, bangunan, banyak nama jalan — dan labelnya tampil kontras penuh
 * karena basemap-nya buram biasa.
 *
 * Kebijakan OSM meminta trafik tinggi pindah ke mirror komersial; portal
 * kelurahan jauh di bawah ambang itu.
 */
export const STREETS_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAX_ZOOM = 19;

/**
 * ── Kenapa tidak ada hybrid "satelit + nama jalan" ──────────────────────
 *
 * Tiga pendekatan sudah dicoba dan ditolak (diukur pada 24 tile wilayah
 * kelurahan, 2026-08-06):
 *
 *   Overlay label transparan kosong di sini — Esri dan CARTO
 *   *_only_labels sama-sama mengembalikan tile nyaris kosong.
 *
 *   multiply + OSM standar: label nyaris hitam, hilang di atas citra gelap.
 *
 *   screen/lighten + basemap gelap CARTO: label jadi terang tapi
 *   translusen, tidak pernah terbaca solid.
 *
 * Membalik warna OSM juga gagal — jalan lingkungan terisi putih, dibalik
 * jadi hitam dan blend-nya malah menghilangkannya.
 *
 * Jangan coba hybrid lagi tanpa mengulang pengukuran tile itu.
 */

/** Nama berbahasa Indonesia untuk pemilih layer — audiensnya editor dan
 * pengunjung, jadi ini tidak pernah ditampilkan dalam bahasa Inggris. */
export const LAYER_LABELS = {
  satellite: "Satelit",
  streets: "Peta Jalan",
} as const;
