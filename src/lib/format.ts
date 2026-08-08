/** Helper tanggal/pengelompokan bahasa Indonesia, dipakai bersama oleh halaman konten. */

/** contoh: "15 Juni 2025" */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * contoh: "15 Juni" — dipakai di kartu Prestasi, di mana tahunnya sudah
 * jadi judul timeline dan mengulanginya di tiap kartu cuma jadi noise.
 */
export function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });
}

export interface YearGroup<T> {
  year: number;
  items: T[];
}

/**
 * Mengelompokkan item berdasarkan tahun dari field tanggal, tahun terbaru
 * lebih dulu, menjaga urutan aslinya di dalam tiap tahun (query sudah
 * mengurutkan berdasarkan publishedAt desc).
 */
export function groupByYear<T>(
  items: readonly T[],
  getDate: (item: T) => string | null | undefined,
): YearGroup<T>[] {
  const byYear = new Map<number, T[]>();

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const year = new Date(raw).getFullYear();
    if (Number.isNaN(year)) continue;
    const bucket = byYear.get(year);
    if (bucket) bucket.push(item);
    else byYear.set(year, [item]);
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, items]) => ({ year, items }));
}
