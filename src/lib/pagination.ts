export const POSTS_PER_PAGE = 12;

export interface PageInfo {
  page: number;
  totalPages: number;
  /** Batas slice GROQ: [$start...$end] */
  start: number;
  end: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Mem-parsing nilai `?page=` yang datang sebagai string (atau array, atau
 * kosong) yang tidak bisa dipercaya, dan mengembalikan null untuk apa pun
 * yang bukan bilangan bulat >= 1, supaya halamannya bisa 404 alih-alih diam-
 * diam menampilkan halaman 1.
 */
export function parsePageParam(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  if (Array.isArray(raw)) return null;
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 ? page : null;
}

export function getPageInfo(
  page: number,
  total: number,
  perPage = POSTS_PER_PAGE,
): PageInfo {
  // Daftar kosong tetap punya satu halaman (kosong), supaya UI-nya tetap
  // punya sesuatu untuk ditampilkan.
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    page,
    totalPages,
    start,
    end: start + perPage,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
