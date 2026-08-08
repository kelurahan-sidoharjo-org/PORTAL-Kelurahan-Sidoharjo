import { defineField, defineType } from "sanity";
import { LocationInput } from "./components/locationInput";
import { withUploadHint } from "./uploadHint";

export const umkm = defineType({
  name: "umkm",
  title: "UMKM",
  type: "document",
  fields: [
    defineField({
      name: "businessName",
      title: "Nama Usaha",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Deskripsi Singkat",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "photo",
      title: "Foto",
      description: withUploadHint(),
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "contactUrl",
      title: "Tautan Kontak",
      description: "Contoh: tautan WhatsApp atau Line resmi usaha",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "googleMapsUrl",
      title: "Tautan Google Maps",
      description:
        "Opsional — tombol \"lihat peta\" di halaman UMKM hanya muncul jika tautan ini diisi. Jika Titik Lokasi di bawah terisi tapi ini kosong, pin di halaman Peta tetap membuka Google Maps memakai titik itu.",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "location",
      title: "Titik Lokasi",
      description:
        "Opsional — isi supaya usaha ini juga muncul sebagai pin di halaman Peta. Cari nama tempatnya, lalu geser pin sampai tepat.",
      type: "geopoint",
      components: { input: LocationInput },
    }),
  ],
  preview: {
    select: {
      title: "businessName",
      subtitle: "description",
      media: "photo",
    },
  },
});
