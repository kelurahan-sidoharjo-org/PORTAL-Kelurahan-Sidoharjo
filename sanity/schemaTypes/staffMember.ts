import { defineField, defineType } from "sanity";
import { withUploadHint } from "./uploadHint";

export const staffMember = defineType({
  name: "staffMember",
  title: "Anggota Kelurahan",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nama",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "position",
      title: "Jabatan",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "photo",
      title: "Foto",
      description: withUploadHint(),
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "order",
      title: "Urutan Tampilan",
      description: "Angka lebih kecil tampil lebih dulu",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "position",
      media: "photo",
    },
  },
});
