import { useEffect, useRef } from "react";
import { set, unset, useFormValue } from "sanity";
import type {
  FieldProps,
  FormPatch,
  ObjectInputProps,
  SlugValue,
} from "sanity";
import { nextSlugState } from "./slugHistory";

const PUBLISHED_AT_DESCRIPTIONS: Record<string, string> = {
  berita:
    "Terisi otomatis dengan tanggal hari ini — ubah hanya jika ingin memakai tanggal lain",
  prestasi:
    "Terisi otomatis dengan tanggal hari ini — juga dipakai untuk mengelompokkan prestasi per tahun",
};

/** Menukar teks bantuan di bawah Tanggal Publikasi tergantung Berita vs Prestasi. */
export function PublishedAtField(props: FieldProps) {
  const category = useFormValue(["category"]) as string | undefined;
  const description = category
    ? PUBLISHED_AT_DESCRIPTIONS[category]
    : props.description;
  return props.renderDefault({ ...props, description });
}

/** Panjang excerpt maksimum; baris pertama yang lebih panjang dipotong di batas kata. */
const MAX_EXCERPT = 200;

/**
 * Portable Text adalah array of blocks; sebuah "paragraf" adalah block yang
 * children-nya berupa span teks. Fungsi ini mengambil teks polos dari block
 * pertama yang benar-benar berisi teks — melewati, misalnya, gambar di awal
 * yang ditaruh editor.
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

/** Memotong ke MAX_EXCERPT pada batas kata utuh terakhir dan menambah elipsis. */
function truncate(text: string): string {
  if (text.length <= MAX_EXCERPT) return text;
  const clipped = text.slice(0, MAX_EXCERPT);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : MAX_EXCERPT).trimEnd()}…`;
}

/**
 * Input level dokumen yang mengisi/menjaga dua field otomatis:
 *
 *  - `slug` — selalu mencerminkan judul + tanggal dibuat (hidden,
 *    turunan), dengan alamat lama tersimpan di `previousSlugs`. Aturannya
 *    di slugHistory.ts.
 *  - `excerpt` — default-nya baris pertama body, tapi tetap bisa diedit;
 *    begitu editor menulis sendiri, kita berhenti menyentuhnya.
 *
 * Harus di level dokumen: field `hidden` melepas mount input-nya dan
 * menghentikan sinkronisasi, input level dokumen tetap ter-mount apa pun
 * field yang dirender.
 */
export function PostDocumentInput(props: ObjectInputProps) {
  const { onChange, readOnly } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const createdAt = useFormValue(["_createdAt"]) as string | undefined;
  const currentSlug = (useFormValue(["slug"]) as SlugValue | undefined)?.current;
  const previousSlugs = useFormValue(["previousSlugs"]) as string[] | undefined;
  const body = useFormValue(["body"]);
  const currentExcerpt = useFormValue(["excerpt"]) as string | undefined;
  const fallbackDateRef = useRef(new Date().toISOString());
  // Slug terakhir yang kita tulis sendiri — membedakan slug sementara
  // dari alamat yang sudah dibawa dokumen. Lihat slugHistory.ts.
  const lastWrittenSlugRef = useRef<string | null>(null);
  // Excerpt terakhir yang kita isi otomatis. Selama field masih
  // menyimpannya (atau kosong), kita terus mengikuti body; begitu
  // berbeda, editor sudah menulis sendiri.
  const lastAutoExcerptRef = useRef("");

  useEffect(() => {
    // Saat form read-only (melihat versi Published, revisi lama, atau
    // release), Sanity menolak patch apa pun, jadi jangan dicoba.
    if (readOnly || !title) return;

    const update = nextSlugState({
      title,
      datePart: (createdAt ?? fallbackDateRef.current).slice(0, 10),
      currentSlug,
      lastWritten: lastWrittenSlugRef.current,
      previousSlugs,
    });
    if (!update) return;

    // Kedua field berubah dalam satu perubahan, supaya artikel tidak pernah
    // tertinggal dengan alamat baru tanpa catatan alamat lamanya.
    const patches: FormPatch[] = [
      set({ _type: "slug", current: update.slug }, ["slug"]),
    ];
    if (update.previousSlugs) {
      patches.push(set(update.previousSlugs, ["previousSlugs"]));
    }

    lastWrittenSlugRef.current = update.slug;
    onChange(patches);
  }, [title, createdAt, currentSlug, previousSlugs, onChange, readOnly]);

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
