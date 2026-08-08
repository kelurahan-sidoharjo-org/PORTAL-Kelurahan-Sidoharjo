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
      // Sengaja tetap terlihat dan bisa diedit, supaya pengumuman lama bisa
      // dimundurkan tanggalnya. Wajib diisi hanya supaya tidak *kosong*:
      // halamannya memformat tanpa penjagaan, jadi tanggal kosong mencetak
      // "Invalid Date" secara harfiah di tiap kartu, dan membuang artikel itu
      // sepenuhnya dari /prestasi (groupByYear melewati item tanpa tanggal).
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
    // Diturunkan otomatis oleh PostDocumentInput; ditaruh terakhir di daftar
    // supaya kalaupun versi Studio nanti mulai merender field hidden, ia
    // mendarat di bagian bawah form, bukan memisah-misah field yang terlihat.
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    /**
     * Setiap alamat yang pernah dipakai artikel ini. Mengedit judul mengubah
     * `slug`, yang tanpa ini akan membuat 404 setiap tautan yang sudah
     * ditempel di grup WhatsApp warga dan setiap URL yang sudah terindeks
     * Google. Menyimpan yang lama membuat /berita/[slug] tetap bisa
     * menemukan artikelnya dan mengarahkan ke alamat terbarunya.
     *
     * `hidden` tapi TIDAK `readOnly`, sama seperti `slug` di atas:
     * PostDocumentInput menulis ini lewat patch, dan field read-only bisa
     * menolak patch. `readOnly` pada `category` aman hanya karena field itu
     * diisi lewat template initial-value, bukan lewat patching.
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
