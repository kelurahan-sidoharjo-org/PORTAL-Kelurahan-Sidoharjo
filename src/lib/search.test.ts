import { describe, expect, it } from "vitest";
import { searchValue, toMatchPattern } from "./search";

describe("toMatchPattern", () => {
  /**
   * null adalah sinyal "tanpa filter" yang jadi cabang di query
   * (`!defined($q)`). Kalau kotak kosong malah mengembalikan "" atau "*",
   * /berita akan error atau diam-diam berhenti menampilkan post — jadi
   * setiap variasi "kosong" dipastikan di sini.
   */
  it("returns null for anything that isn't a search", () => {
    expect(toMatchPattern(undefined)).toBeNull();
    expect(toMatchPattern("")).toBeNull();
    expect(toMatchPattern("   ")).toBeNull();
  });

  /**
   * Inilah alasan fungsi ini ada: `match` GROQ bekerja pada kata utuh,
   * jadi "kebersih" tidak akan menemukan apa-apa di artikel tentang
   * "kebersihan". Tanda * di belakang itulah yang mengembalikan
   * pencocokan sebagian yang diharapkan pembaca dari pencarian /peta.
   */
  it("appends a wildcard so partial words still match", () => {
    expect(toMatchPattern("kebersih")).toBe("kebersih*");
  });

  /** Kata dikembalikan sudah terurut — lihat tes canonical-form di bawah. */
  it("wildcards every word, not just the last", () => {
    expect(toMatchPattern("kerja bakti")).toBe("bakti* kerja*");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(toMatchPattern("  kerja   bakti  ")).toBe("bakti* kerja*");
  });

  /**
   * `*` adalah wildcard milik GROQ sendiri. Kalau dibiarkan, pembaca yang
   * mengetiknya justru melebarkan pencariannya alih-alih mempersempit —
   * kebalikan dari fungsi kotak pencarian.
   */
  it("strips wildcards the reader typed", () => {
    expect(toMatchPattern("*kerja*")).toBe("kerja*");
    expect(toMatchPattern("*")).toBeNull();
  });

  /**
   * `?q=a&q=b` datang sebagai array. Beda dengan nomor halaman yang
   * salah — yang langsung 404 — pencarian yang salah bentuk tetap harus
   * menampilkan hasil, bukan jalan buntu.
   */
  it("takes the first value when the param repeats", () => {
    expect(toMatchPattern(["kerja", "bakti"])).toBe("kerja*");
  });
});

/**
 * Pola ini adalah cache key sekaligus filter: tiap pola yang berbeda
 * berbiaya dua pembacaan hidup ke API utama Sanity (CDN-nya mati — lihat
 * client.ts). Tes-tes ini memastikan dua sifat yang menjaga biaya itu
 * tetap terbatas.
 *
 * Ketiga penyamarataan (folding) ini netral secara hasil — `match` GROQ
 * mengabaikan huruf besar/kecil, urutan kata, dan kata berulang (sudah
 * diverifikasi terhadap dataset produksi, 2026-08-08). Jadi tidak satu pun
 * dari ini mempersempit apa yang bisa ditemukan pembaca; ini cuma
 * menghentikan pencarian yang sama dibayar dua kali.
 */
describe("toMatchPattern — canonical form", () => {
  it("folds case, so KERJA and kerja share one cache entry", () => {
    expect(toMatchPattern("KERJA BAKTI")).toBe(toMatchPattern("kerja bakti"));
  });

  it("folds word order, so every permutation shares one cache entry", () => {
    expect(toMatchPattern("bakti kerja")).toBe(toMatchPattern("kerja bakti"));
  });

  it("folds repeated words, which add nothing to a `match`", () => {
    expect(toMatchPattern("kerja kerja bakti")).toBe(
      toMatchPattern("kerja bakti"),
    );
  });
});

describe("toMatchPattern — cost guardrails", () => {
  /**
   * Pemotongan aman justru karena wildcard di belakangnya: kata yang
   * terpotong separuh tetap cocok sebagai awalan, jadi pembaca tetap
   * mendapatkan artikelnya.
   */
  it("truncates past 60 characters instead of passing it all to Sanity", () => {
    expect(toMatchPattern("kebersihan".repeat(20))).toBe(
      `${"kebersihan".repeat(6)}*`,
    );
  });

  it("keeps at most six words, so a wall of terms can't build a huge pattern", () => {
    // Terurut, jadi enam yang tersisa adalah a…f, bukan enam yang diketik pertama.
    expect(toMatchPattern("a b c d e f g h i j")).toBe("a* b* c* d* e* f*");
  });

  /**
   * Bentuk penyalahgunaan yang sesungguhnya: nilai yang sangat panjang,
   * dilempar ke endpoint berulang-ulang. Harus turun jadi pola kecil biasa,
   * tidak pernah error, dan tidak pernah sampai ke Sanity dalam ukuran penuh.
   */
  it("survives a 10.000-character value", () => {
    const pattern = toMatchPattern("a".repeat(10_000));
    expect(pattern).toBe(`${"a".repeat(60)}*`);
  });
});

describe("searchValue", () => {
  /** Dikembalikan ke input; tanpa ini kotaknya jadi kosong sendiri saat reload. */
  it("hands back the raw text, untouched", () => {
    expect(searchValue("kerja bakti")).toBe("kerja bakti");
    expect(searchValue(["kerja", "bakti"])).toBe("kerja");
  });

  it("is an empty string, never undefined, so the input stays controlled", () => {
    expect(searchValue(undefined)).toBe("");
  });
});
