import { describe, expect, it } from "vitest";
import { nextSlugState, slugify } from "./slugHistory";

const DATE = "2026-07-01";

/** Merapikan tiap kasus: hanya field yang sedang diuji yang berubah-ubah. */
function state(input: {
  title: string;
  currentSlug?: string;
  lastWritten?: string | null;
  previousSlugs?: string[];
}) {
  return nextSlugState({
    title: input.title,
    datePart: DATE,
    currentSlug: input.currentSlug,
    lastWritten: input.lastWritten ?? null,
    previousSlugs: input.previousSlugs,
  });
}

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Kerja Bakti")).toBe("kerja-bakti");
  });

  it("strips accents rather than dropping the letter", () => {
    expect(slugify("Perayaan Idul Fitri")).toBe("perayaan-idul-fitri");
    expect(slugify("Café")).toBe("cafe");
  });

  it("drops punctuation and collapses repeated separators", () => {
    expect(slugify("Juara 1! Lomba  Kebersihan (2026)")).toBe(
      "juara-1-lomba-kebersihan-2026",
    );
  });

  it("ignores surrounding whitespace", () => {
    expect(slugify("   Pengumuman   ")).toBe("pengumuman");
  });

  it("caps the length so the URL stays manageable", () => {
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });
});

describe("nextSlugState", () => {
  it("does nothing when the derived slug already matches", () => {
    expect(state({ title: "Kerja Bakti", currentSlug: `kerja-bakti-${DATE}` }))
      .toBeNull();
  });

  it("does nothing for a blank title", () => {
    expect(state({ title: "   " })).toBeNull();
  });

  /**
   * Kasus yang menjaga riwayat tetap jujur. Mengetik judul di artikel baru
   * memicu ini setiap ketukan tuts; tiap slug itu adalah tulisan kita sendiri
   * dan tidak pernah bisa diakses, jadi tidak satu pun boleh dicatat. Tanpa
   * ini riwayatnya akan terisi "k-", "ke-", "ker-" dan mengubur alamat yang
   * sebenarnya penting.
   */
  it("records nothing while the editor types a new article", () => {
    // Ketukan pertama: field masih kosong.
    let result = state({ title: "K" });
    expect(result).toEqual({ slug: `k-${DATE}` });

    // Setiap ketukan sesudahnya: slug yang keluar adalah yang baru saja kita
    // tulis.
    result = state({
      title: "Ker",
      currentSlug: `k-${DATE}`,
      lastWritten: `k-${DATE}`,
    });
    expect(result).toEqual({ slug: `ker-${DATE}` });

    result = state({
      title: "Kerja Bakti",
      currentSlug: `ker-${DATE}`,
      lastWritten: `ker-${DATE}`,
    });
    expect(result).toEqual({ slug: `kerja-bakti-${DATE}` });
  });

  /**
   * Bug yang jadi alasan modul ini ada: alamat artikel yang sudah terbit
   * harus tetap bertahan walau judulnya diedit.
   */
  it("keeps the old address when a saved article is retitled", () => {
    expect(
      state({ title: "Kerja Bakti RT 03", currentSlug: `kerja-bakti-${DATE}` }),
    ).toEqual({
      slug: `kerja-bakti-rt-03-${DATE}`,
      previousSlugs: [`kerja-bakti-${DATE}`],
    });
  });

  /**
   * Loading dokumen yang lambat membuat currentSlug undefined pada render
   * pertama. Begitu slug asli sampai, ia tetap terbaca sebagai "bukan
   * tulisan kita", jadi tetap disimpan — modul ini tidak pernah perlu
   * menebak apakah form-nya sudah selesai loading.
   */
  it("keeps the old address even if the form rendered before the document", () => {
    // Render pertama: belum ada yang termuat, jadi belum ada yang perlu
    // disimpan.
    expect(state({ title: "Kerja Bakti" })).toEqual({
      slug: `kerja-bakti-${DATE}`,
    });

    // Render kedua: dokumen sudah sampai dengan slug aslinya, dan editor
    // mengedit judulnya. lastWritten masih null, jadi slug-nya tetap
    // tersimpan.
    expect(
      state({ title: "Kerja Bakti RT 03", currentSlug: `kerja-bakti-${DATE}` }),
    ).toEqual({
      slug: `kerja-bakti-rt-03-${DATE}`,
      previousSlugs: [`kerja-bakti-${DATE}`],
    });
  });

  it("records only the real address when a retitle continues", () => {
    // Slug yang sudah terbit sudah tersimpan sejak ketukan sebelumnya.
    const result = state({
      title: "Kerja Bakti RT 03 Sidoharjo",
      currentSlug: `kerja-bakti-rt-03-${DATE}`,
      lastWritten: `kerja-bakti-rt-03-${DATE}`,
      previousSlugs: [`kerja-bakti-${DATE}`],
    });

    // Slug berpindah, riwayat tidak tersentuh — jadi tidak ada patch yang
    // berlebihan dikirim.
    expect(result).toEqual({ slug: `kerja-bakti-rt-03-sidoharjo-${DATE}` });
  });

  it("never records the same address twice", () => {
    expect(
      state({
        title: "Judul Baru",
        currentSlug: `kerja-bakti-${DATE}`,
        previousSlugs: [`kerja-bakti-${DATE}`],
      }),
    ).toEqual({ slug: `judul-baru-${DATE}` });
  });

  /**
   * Editor yang membatalkan perubahan nama membuat alamat lama aktif lagi.
   * Kalau dibiarkan di riwayat, /berita/[slug] akan mengarahkan slug itu ke
   * dirinya sendiri.
   */
  it("takes the address back out of the history when it becomes live again", () => {
    expect(
      state({
        title: "Kerja Bakti",
        currentSlug: `kerja-bakti-rt-03-${DATE}`,
        lastWritten: `kerja-bakti-rt-03-${DATE}`,
        previousSlugs: [`kerja-bakti-${DATE}`],
      }),
    ).toEqual({ slug: `kerja-bakti-${DATE}`, previousSlugs: [] });
  });

  it("copes with articles created before the field existed", () => {
    expect(
      state({
        title: "Judul Baru",
        currentSlug: `judul-lama-${DATE}`,
        previousSlugs: undefined,
      }),
    ).toEqual({
      slug: `judul-baru-${DATE}`,
      previousSlugs: [`judul-lama-${DATE}`],
    });
  });
});
