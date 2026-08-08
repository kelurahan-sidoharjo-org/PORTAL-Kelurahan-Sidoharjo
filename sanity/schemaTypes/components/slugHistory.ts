/**
 * Aturan slug di balik PostDocumentInput, dipisah dari komponennya supaya bisa
 * diuji unit tanpa merender form Sanity — pembagian yang sama seperti
 * src/lib/places.ts, di mana helper memegang logikanya dan komponen cuma
 * mengurus state dan render.
 */

/** Panjang slug maksimum yang diturunkan dari judul. */
const MAX_SLUG = 80;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Memecah huruf beraksen jadi huruf dasar + tanda gabung, supaya replace
    // berikutnya bisa membuang tandanya dan menyisakan "é" jadi "e", bukan
    // menghapusnya sama sekali.
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, MAX_SLUG);
}

export interface SlugUpdate {
  /** Alamat yang mulai sekarang dipakai artikel ini. */
  slug: string;
  /**
   * Riwayat yang sudah diperbarui. Hanya muncul kalau memang berubah, supaya
   * pemanggil tidak mengirim patch yang menyetel ke nilai yang sudah sama.
   */
  previousSlugs?: string[];
}

/**
 * Menentukan alamat berikutnya untuk artikel, dan alamat lama mana yang
 * harus tetap berfungsi.
 *
 * Mengedit judul mengubah slug. Pada artikel terbit, itu diam-diam
 * memindahkan URL-nya — tautan di WhatsApp warga dan URL terindeks Google
 * jadi 404. Menyimpan alamat lama membuat /berita/[slug] tetap menemukan
 * artikelnya dan mengarahkan ke alamat terbaru.
 *
 * Bagian sulitnya: membedakan alamat *publik* dari yang sekadar sementara.
 * Mengetik "Kerja Bakti" di artikel baru membuat slug lewat "k-…", "ke-…",
 * "ker-…" — tulisan kita sendiri per ketukan tuts, tidak pernah bisa
 * diakses. Kalau ikut dicatat, satu alamat penting terkubur di bawah
 * selusin alamat palsu. `lastWritten` adalah slug terakhir yang ditulis
 * modul ini: selain itu berarti berasal dari dokumen dan mungkin publik.
 *
 * Ini juga tetap benar walau loading lambat: form yang merender sebelum
 * dokumen sampai punya `currentSlug` undefined dan `lastWritten` null;
 * begitu slug asli tiba, tetap terbaca "bukan tulisan kita" dan tersimpan
 * benar — tanpa asumsi soal waktu mount.
 *
 * Mengembalikan null kalau tidak ada yang perlu diubah.
 */
export function nextSlugState({
  title,
  datePart,
  currentSlug,
  lastWritten,
  previousSlugs,
}: {
  title: string;
  /** Tanggal YYYY-MM-DD yang jadi akhiran slug, diambil dari `_createdAt`. */
  datePart: string;
  currentSlug: string | undefined;
  /** Slug terakhir yang ditulis modul ini, atau null kalau belum pernah menulis. */
  lastWritten: string | null;
  previousSlugs: string[] | undefined;
}): SlugUpdate | null {
  // Judul kosong akan menghasilkan slug telanjang "-2026-08-04". Pemanggil
  // juga sudah menjaga ini; dicek lagi di sini supaya helper-nya tetap benar
  // berdiri sendiri.
  if (!title.trim()) return null;

  const slug = `${slugify(title)}-${datePart}`;
  if (slug === currentSlug) return null;

  const history = previousSlugs ?? [];

  const worthKeeping = currentSlug !== undefined && currentSlug !== lastWritten;
  const grown =
    worthKeeping && !history.includes(currentSlug)
      ? [...history, currentSlug]
      : history;

  // Slug yang masuk mungkin alamat lama yang pernah dipakai artikel ini —
  // misalnya editor membatalkan perubahan judul. Alamat itu jadi alamat aktif
  // sekarang, jadi tidak boleh ikut nangkring di riwayat, atau
  // /berita/[slug] akan mengarahkannya ke dirinya sendiri.
  const cleaned = grown.filter((entry) => entry !== slug);

  const changed =
    cleaned.length !== history.length ||
    cleaned.some((entry, index) => entry !== history[index]);

  return changed ? { slug, previousSlugs: cleaned } : { slug };
}
