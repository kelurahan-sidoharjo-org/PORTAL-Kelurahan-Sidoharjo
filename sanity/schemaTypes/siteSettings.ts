import { defineField, defineType } from "sanity";
import { withUploadHint } from "./uploadHint";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Pengaturan Situs",
  type: "document",
  fields: [
    defineField({
      name: "villageName",
      title: "Nama Kelurahan",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heroVideoUrl",
      title: "Video Beranda (YouTube)",
      description: "Tautan video YouTube yang ditampilkan di halaman utama",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "officeImage",
      title: "Foto Kantor Kelurahan",
      description: withUploadHint(
        "Foto gedung kantor, dipakai sebagai gambar latar di halaman Kantor Kelurahan",
      ),
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "orgChartImage",
      title: "Struktur Organisasi",
      description: withUploadHint(),
      type: "image",
    }),
    // No `kelurahanMapImage`: /peta draws a real interactive map now, so the
    // uploaded picture had no effect on anything. Dropped rather than left in
    // place for the same reason `logo` was — a Studio control that changes
    // nothing misleads staff after handover.
    defineField({
      name: "contactEmail",
      title: "Email Kontak",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "contactWhatsapp",
      title: "Nomor WhatsApp",
      description: "Termasuk kode negara, contoh: 6281234567890",
      type: "string",
    }),
    defineField({
      name: "googleMapsUrl",
      title: "Tautan Google Maps Kantor",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "instagramUrl",
      title: "Tautan Instagram",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "tiktokUrl",
      title: "Tautan TikTok",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Pengaturan Situs" };
    },
  },
});
