import { useEffect, useRef } from "react";
import { set, unset, useFormValue } from "sanity";
import type { FieldProps, ObjectInputProps, SlugValue } from "sanity";

const PUBLISHED_AT_DESCRIPTIONS: Record<string, string> = {
  berita:
    "Terisi otomatis dengan tanggal hari ini — ubah hanya jika ingin memakai tanggal lain",
  prestasi:
    "Terisi otomatis dengan tanggal hari ini — juga dipakai untuk mengelompokkan prestasi per tahun",
};

/** Swaps the help text under Tanggal Publikasi depending on Berita vs Prestasi. */
export function PublishedAtField(props: FieldProps) {
  const category = useFormValue(["category"]) as string | undefined;
  const description = category
    ? PUBLISHED_AT_DESCRIPTIONS[category]
    : props.description;
  return props.renderDefault({ ...props, description });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Longest excerpt we'll store; longer first lines get cut at a word boundary. */
const MAX_EXCERPT = 200;

/**
 * Portable Text is an array of blocks; a "paragraph" is a block whose children
 * are spans of text. This pulls the plain text out of the first block that
 * actually has any — skipping, e.g., a leading image the editor dropped in.
 */
function firstLineOfBody(body: unknown): string {
  if (!Array.isArray(body)) return "";
  for (const block of body) {
    if (block?._type !== "block" || !Array.isArray(block.children)) continue;
    const text = block.children
      .map((child: { text?: string }) => child?.text ?? "")
      .join("")
      .trim();
    if (text) return text;
  }
  return "";
}

/** Cuts to MAX_EXCERPT at the last whole word and appends an ellipsis. */
function truncate(text: string): string {
  if (text.length <= MAX_EXCERPT) return text;
  const clipped = text.slice(0, MAX_EXCERPT);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : MAX_EXCERPT).trimEnd()}…`;
}

/**
 * Document-level input that seeds/keeps two fields from the editor's other
 * input, so neither needs filling by hand:
 *
 *  - `slug`    — always mirrors title + creation date (hidden, fully derived)
 *  - `excerpt` — *defaults* to the first line of the body, but stays editable:
 *    once the editor types their own summary, we stop touching it.
 *
 * Both have to live at the document level rather than on their own fields: a
 * `hidden` field unmounts its field-level input and stops it syncing, whereas a
 * document-level input stays mounted no matter which fields render.
 */
export function PostDocumentInput(props: ObjectInputProps) {
  const { onChange, readOnly } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const createdAt = useFormValue(["_createdAt"]) as string | undefined;
  const currentSlug = (useFormValue(["slug"]) as SlugValue | undefined)?.current;
  const body = useFormValue(["body"]);
  const currentExcerpt = useFormValue(["excerpt"]) as string | undefined;
  const fallbackDateRef = useRef(new Date().toISOString());
  // The last excerpt we auto-filled. While the field still holds this (or is
  // empty), the editor hasn't overridden it, so we keep it tracking the body.
  // The moment it differs, they've written their own — and we leave it alone.
  const lastAutoExcerptRef = useRef("");

  useEffect(() => {
    // When the form is read-only (viewing the Published version, an old
    // revision, or a release) Sanity rejects any patch, so don't attempt one.
    if (readOnly || !title) return;
    const datePart = (createdAt ?? fallbackDateRef.current).slice(0, 10);
    const next = `${slugify(title)}-${datePart}`;
    if (currentSlug !== next) {
      onChange(set({ _type: "slug", current: next }, ["slug"]));
    }
  }, [title, createdAt, currentSlug, onChange, readOnly]);

  useEffect(() => {
    if (readOnly) return;
    const current = currentExcerpt ?? "";
    const isStillAuto = current === "" || current === lastAutoExcerptRef.current;
    if (!isStillAuto) return;

    const next = truncate(firstLineOfBody(body));
    if (next !== current) {
      onChange(next ? set(next, ["excerpt"]) : unset(["excerpt"]));
      lastAutoExcerptRef.current = next;
    }
  }, [body, currentExcerpt, onChange, readOnly]);

  return props.renderDefault(props);
}
