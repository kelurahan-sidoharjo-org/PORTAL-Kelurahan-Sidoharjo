import { defineField, defineType } from "sanity";
import { LocationInput } from "./components/locationInput";

/**
 * Drives the map pin (emoji + colour) and the legend row on /peta. Kept in the
 * same order as `PLACE_CATEGORIES` in src/lib/places.ts, which owns how the
 * legend renders — the two lists must hold the same values or a place gets no
 * pin at all.
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
     * Since /peta dropped its card list, a place without a point is invisible
     * to visitors — and nothing in the default preview would have said so.
     * Surfacing it in the document list is the only warning staff get.
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
