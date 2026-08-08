/**
 * Pagar biaya, bukan pagar kegunaan.
 *
 * Tiap nilai `?q=` yang berbeda adalah cache key Data Cache Next
 * tersendiri, dan tiap key baru berarti dua pembacaan hidup ke API utama
 * Sanity (CDN-nya mati — lihat client.ts). Tanpa batas, satu skrip sepele
 * bisa menguras kuota Sanity sampai revalidasi berhenti — gejalanya cuma
 * berita yang sudah dipublikasikan tidak pernah muncul, tanpa error.
 *
 * 60 karakter / 6 kata jauh di atas pencarian sungguhan. Memotong di
 * tengah kata aman: wildcard di belakang tetap membuatnya cocok sebagai
 * awalan.
 */
const MAX_LENGTH = 60;
const MAX_WORDS = 6;

/**
 * Mengubah nilai `?q=` mentah menjadi pola `match` GROQ.
 *
 * Beda dari /peta — semua place sudah di browser dan bisa dicocokkan
 * langsung — /berita cuma menyimpan satu halaman post, jadi pencariannya
 * harus di Sanity. `match` GROQ bekerja pada kata utuh, jadi "kebersih"
 * tidak menemukan apa-apa; wildcard `*` di belakang mengembalikan
 * perilaku "mengetik dan hasilnya menyempit" yang diharapkan pembaca.
 *
 * Hasilnya juga bentuk *baku* (canonical): pencarian yang cuma beda ejaan
 * berbagi satu entri cache, bukan masing-masing membayar sepasang
 * pembacaan Sanity sendiri. Ketiga normalisasi di bawah sudah
 * diverifikasi netral secara hasil (2026-08-08): `match` mengabaikan
 * huruf besar/kecil, urutan kata, dan kata berulang.
 *
 * Mengembalikan null kalau tidak ada yang dicari — dibaca query sebagai
 * "tanpa filter", lihat `!defined($q)` di queries.ts.
 */
export function toMatchPattern(
  raw: string | string[] | undefined,
): string | null {
  // `?q=a&q=b` datang sebagai array. Ambil yang pertama, jangan 404 —
  // beda dengan nomor halaman yang salah bentuk.
  const value = Array.isArray(raw) ? raw[0] : raw;

  const words = (value ?? "")
    .slice(0, MAX_LENGTH)
    // `match` sudah case-insensitive, jadi ini tidak mengubah hasil apa pun —
    // cuma menyatukan "Kerja", "kerja", dan "KERJA" ke satu cache key.
    .toLowerCase()
    // `*` adalah wildcard milik GROQ sendiri. Membuangnya mencegah tanda
    // bintang nyasar melebarkan pencarian alih-alih mempersempitnya.
    .replace(/\*/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Kata unik, diurutkan: `match` tidak peduli urutan kata, jadi tiap
  // permutasi pencarian menyatu ke pola — dan cache key — yang sama.
  const canonical = [...new Set(words)].sort().slice(0, MAX_WORDS);

  if (canonical.length === 0) return null;
  return canonical.map((word) => `${word}*`).join(" ");
}

/** Teks mentah untuk ditaruh kembali di kotak pencarian, supaya query-nya tetap terlihat. */
export function searchValue(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ?? "";
}
