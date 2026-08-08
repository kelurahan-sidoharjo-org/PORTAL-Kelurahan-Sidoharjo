import { defineField, defineType } from "sanity";
import { LocationInput } from "./components/locationInput";

/**
 * Menentukan pin peta (emoji + warna) dan baris legenda di /peta. Urutannya
 * dijaga sama dengan `PLACE_CATEGORIES` di src/lib/places.ts, yang mengatur
 * cara legenda dirender — kedua daftar harus punya nilai yang sama atau
 * sebuah tempat sama sekali tidak dapat pin.
 */
const CATEGORIES = [
  { title: "Pemerintahan", value: "pemerintahan" },
  { title: "Ibadah", value: "ibadah" },
  { title: "Sekolah", value: "sekolah" },
  { title: "Kesehatan", value: "kesehatan" },
  { title: "Toko", value: "toko" },
  { title: "Pertanian", value: "pertanian" },
  { title: "Perkebunan", value: "perkebunan" },
  { title: "Kandang", value: "kandang" },
  { title: "Industri", value: "industri" },
  { title: "Jasa", value: "jasa" },
  { title: "Wisata", value: "wisata" },
  { title: "Landmark", value: "landmark" },
  { title: "Lainnya", value: "lainnya" },
];

export const place = defineType({
  name: "place",
  title: "Tempat Umum",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nama",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategori",
      description: "Menentukan ikon dan warna pin di halaman Peta",
      type: "string",
      options: { list: CATEGORIES },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "googleMapsUrl",
      title: "Tautan Google Maps",
      description: "Dibuka ketika pin di peta diklik",
      type: "url",
      validation: (Rule) =>
        Rule.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "location",
      title: "Titik Lokasi",
      description:
        "Cari nama tempatnya, lalu geser pin sampai tepat. Tempat tanpa titik lokasi tidak muncul di peta.",
      type: "geopoint",
      components: { input: LocationInput },
    }),
  ],
  preview: {
    select: {
      title: "name",
      category: "category",
      lat: "location.lat",
    },
    /*
     * Sejak /peta membuang daftar kartunya, tempat tanpa titik lokasi tidak
     * terlihat oleh pengunjung — dan preview bawaan tidak akan memberi tahu
     * apa pun soal itu. Menampilkannya di daftar dokumen adalah satu-satunya
     * peringatan yang didapat staf.
     */
    prepare({ title, category, lat }) {
      return {
        title,
        subtitle:
          typeof lat === "number"
            ? category
            : `${category ?? "Tanpa kategori"} — belum ada titik lokasi`,
      };
    },
  },
});
