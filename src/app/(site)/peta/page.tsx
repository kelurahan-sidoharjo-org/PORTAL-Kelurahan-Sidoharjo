import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { PetaMap } from "@/components/peta/PetaMap";
import { categoryLabel, toMapPins } from "@/lib/places";
import { sanityFetch } from "@/lib/sanity/client";
import { placesQuery, umkmListQuery } from "@/lib/sanity/queries";
import type { Place, Umkm } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Peta & Tempat Publik",
  description:
    "Peta interaktif Kelurahan Sidoharjo dengan titik lokasi tempat umum dan UMKM.",
  alternates: { canonical: "/peta" },
};

export default async function PetaPage() {
  const [places, umkm] = await Promise.all([
    sanityFetch<Place[]>(placesQuery),
    sanityFetch<Umkm[]>(umkmListQuery),
  ]);

  const pins = toMapPins(places, umkm);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Peta &amp; Tempat Publik</PageHeading>

      {/*
       * Peta ini sepenuhnya menggantikan gambar statis + daftar kartu yang
       * lama — cukup tinggi untuk benar-benar berguna dijelajahi, tapi
       * tetap berada di dalam kontainer max-w-6xl normal milik halaman,
       * sama seperti /berita, /umkm, dan /prestasi.
       */}
      <div className="mt-8">
        <PetaMap places={places} umkm={umkm} />
      </div>

      {/*
       * Dirender di sini, bukan di dalam PetaMap/PetaMapCanvas, karena
       * petanya `dynamic(..., { ssr: false })` — Leaflet menyentuh
       * `window` saat diimpor. Daftar yang berada di dalamnya akan
       * sama-sama client-only seperti petanya sendiri, menggagalkan
       * tujuannya: screen reader yang belum selesai memuat JS, atau
       * crawler, juga tidak akan melihat apa pun di sini. Server component
       * ini sudah punya data `places`/`umkm` yang sama, jadi daftarnya
       * tidak menambah biaya komputasi dan selalu terkirim di HTML awal.
       */}
      <ul className="sr-only">
        {pins.map((pin) => (
          <li key={pin.id}>
            <a href={pin.googleMapsUrl} target="_blank" rel="noopener noreferrer">
              {pin.name} ({categoryLabel(pin.category)})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
