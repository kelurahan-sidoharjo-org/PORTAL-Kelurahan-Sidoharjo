/**
 * The slug rules behind PostDocumentInput, kept out of the component so they
 * can be unit-tested without rendering a Sanity form — the same split as
 * src/lib/places.ts, where the helpers carry the logic and the component only
 * does state and render.
 */

/** Longest slug we derive from a title. */
const MAX_SLUG = 80;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Splits accented letters into base + combining mark, so the next replace
    // can drop the marks and leave "é" as "e" rather than deleting it.
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, MAX_SLUG);
}

export interface SlugUpdate {
  /** The address the article should carry from now on. */
  slug: string;
  /**
   * The rewritten history. Present only when it actually changed, so the
   * caller doesn't send a patch that sets it to what it already was.
   */
  previousSlugs?: string[];
}

/**
 * Works out the article's next address, and which old addresses have to keep
 * working.
 *
 * Editing a title rewrites the slug. On a published article that silently
 * moves the URL, so every link already pasted into a village WhatsApp group,
 * and every URL Google has indexed, 404s. Keeping the old addresses lets
 * /berita/[slug] still find the article and redirect to its current one.
 *
 * The hard part is telling a *public* address from a throwaway one. Typing
 * "Kerja Bakti" into a brand-new article walks the slug through "k-…", "ke-…",
 * "ker-…" — our own writes, one per keystroke, none of which was ever
 * reachable. Recording those would bury the one address that matters under a
 * dozen decoys. `lastWritten` is the slug this module wrote last: anything
 * else in the field came from the document itself and may already be public.
 *
 * That test also survives a slow load. If the form renders before the document
 * arrives, `currentSlug` is undefined and `lastWritten` is null; once the real
 * slug lands it still reads as "not ours", so it is preserved correctly. No
 * assumption about mount timing is needed.
 *
 * Returns null when nothing needs to change.
 */
export function nextSlugState({
  title,
  datePart,
  currentSlug,
  lastWritten,
  previousSlugs,
}: {
  title: string;
  /** The YYYY-MM-DD the slug is suffixed with, from `_createdAt`. */
  datePart: string;
  currentSlug: string | undefined;
  /** The slug this module wrote last, or null if it hasn't written one. */
  lastWritten: string | null;
  previousSlugs: string[] | undefined;
}): SlugUpdate | null {
  // An empty title would derive a bare "-2026-08-04". The caller guards this
  // too; checked here as well so the helper is correct on its own terms.
  if (!title.trim()) return null;

  const slug = `${slugify(title)}-${datePart}`;
  if (slug === currentSlug) return null;

  const history = previousSlugs ?? [];

  const worthKeeping = currentSlug !== undefined && currentSlug !== lastWritten;
  const grown =
    worthKeeping && !history.includes(currentSlug)
      ? [...history, currentSlug]
      : history;

  // The incoming slug may be an address this article used to have — an editor
  // undoing a title change, say. It is the live address now, so it must not
  // also sit in the history, or /berita/[slug] would redirect it to itself.
  const cleaned = grown.filter((entry) => entry !== slug);

  const changed =
    cleaned.length !== history.length ||
    cleaned.some((entry, index) => entry !== history[index]);

  return changed ? { slug, previousSlugs: cleaned } : { slug };
}
