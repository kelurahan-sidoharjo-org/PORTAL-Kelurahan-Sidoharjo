import { describe, expect, it } from "vitest";
import { nextSlugState, slugify } from "./slugHistory";

const DATE = "2026-07-01";

/** Trims the noise out of each case: only the fields under test vary. */
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
   * The case that keeps the history honest. Typing a title into a new article
   * fires this once per keystroke; every one of those slugs is ours and was
   * never reachable, so none may be recorded. Without this the history would
   * fill with "k-", "ke-", "ker-" and bury the address that matters.
   */
  it("records nothing while the editor types a new article", () => {
    // First keystroke: the field is still empty.
    let result = state({ title: "K" });
    expect(result).toEqual({ slug: `k-${DATE}` });

    // Every keystroke after: the outgoing slug is the one we just wrote.
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
   * The bug this whole module exists for: a published article's address must
   * survive its title being edited.
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
   * A slow document load leaves currentSlug undefined on the first render.
   * Once the real slug arrives it still reads as "not ours", so it is kept —
   * the module never has to guess whether the form finished loading.
   */
  it("keeps the old address even if the form rendered before the document", () => {
    // Render one: nothing loaded yet, so nothing worth keeping.
    expect(state({ title: "Kerja Bakti" })).toEqual({
      slug: `kerja-bakti-${DATE}`,
    });

    // Render two: the document arrived with its real slug, and the editor
    // edits the title. lastWritten is still null, so the slug is preserved.
    expect(
      state({ title: "Kerja Bakti RT 03", currentSlug: `kerja-bakti-${DATE}` }),
    ).toEqual({
      slug: `kerja-bakti-rt-03-${DATE}`,
      previousSlugs: [`kerja-bakti-${DATE}`],
    });
  });

  it("records only the real address when a retitle continues", () => {
    // The published slug has already been banked by the previous keystroke.
    const result = state({
      title: "Kerja Bakti RT 03 Sidoharjo",
      currentSlug: `kerja-bakti-rt-03-${DATE}`,
      lastWritten: `kerja-bakti-rt-03-${DATE}`,
      previousSlugs: [`kerja-bakti-${DATE}`],
    });

    // Slug moves on, history untouched — so no redundant patch is sent.
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
   * An editor undoing a rename makes an old address live again. Leaving it in
   * the history would have /berita/[slug] redirect that slug to itself.
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
