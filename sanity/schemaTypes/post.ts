import { defineField, defineType } from "sanity";
import {
  PostDocumentInput,
  PublishedAtField,
} from "./components/postDocumentInput";
import { withUploadHint } from "./uploadHint";

export const post = defineType({
  name: "post",
  title: "Artikel",
  type: "document",
  components: { input: PostDocumentInput },
  fields: [
    defineField({
      name: "title",
      title: "Judul",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategori",
      description:
        "Ditentukan otomatis dari menu \"Buat Berita\" / \"Buat Prestasi\" saat dokumen dibuat",
      type: "string",
      options: {
        list: [
          { title: "Berita", value: "berita" },
          { title: "Prestasi", value: "prestasi" },
        ],
      },
      hidden: true,
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Tanggal Publikasi",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      components: { field: PublishedAtField },
      // Stays visible and editable on purpose, so old announcements can be
      // backdated. Required only so it can't be left *empty*: the pages format
      // it unguarded, so a blank date prints a literal "Invalid Date" on every
      // card, and drops the article out of /prestasi entirely (groupByYear
      // skips undated items).
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Isi",
      type: "blockContent",
    }),
    defineField({
      name: "excerpt",
      title: "Deskripsi Singkat",
      description:
        "Terisi otomatis dari baris pertama Isi — boleh diubah bila ingin ringkasan sendiri. Ditampilkan di halaman daftar",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "coverImage",
      title: "Gambar Sampul",
      description: withUploadHint(
        "Ditampilkan sebagai thumbnail di halaman daftar",
      ),
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "images",
      title: "Dokumentasi",
      description: withUploadHint(
        "Kumpulan foto tambahan, ditampilkan di halaman detail",
      ),
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    // Auto-derived by PostDocumentInput; last in the list so that even if a
    // future Studio version starts rendering hidden fields, they land at the
    // bottom of the form instead of splitting the visible fields apart.
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    /**
     * Every address this article has ever had. Editing the title rewrites
     * `slug`, which would otherwise 404 every link already pasted into a
     * village WhatsApp group and every URL Google has indexed. Keeping the old
     * ones lets /berita/[slug] find the article and redirect to its current
     * address instead.
     *
     * `hidden` but NOT `readOnly`, matching `slug` above: PostDocumentInput
     * writes this with a patch, and a read-only field can reject one. The
     * `readOnly` on `category` is safe only because that field is filled by an
     * initial-value template rather than by patching.
     */
    defineField({
      name: "previousSlugs",
      title: "Slug Lama",
      type: "array",
      of: [{ type: "string" }],
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      publishedAt: "publishedAt",
      media: "coverImage",
    },
    prepare({ title, publishedAt, media }) {
      return {
        title,
        subtitle: publishedAt
          ? new Date(publishedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : undefined,
        media,
      };
    },
  },
});
