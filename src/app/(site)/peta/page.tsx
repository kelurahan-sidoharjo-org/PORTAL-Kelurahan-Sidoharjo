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
       * The map replaces the old static image + card list entirely — it's tall
       * enough to actually be useful to explore, but still sits inside the
       * page's normal max-w-6xl container like /berita, /umkm and /prestasi.
       */}
      <div className="mt-8">
        <PetaMap places={places} umkm={umkm} />
      </div>

      {/*
       * Rendered here, not inside PetaMap/PetaMapCanvas, because the map is
       * `dynamic(..., { ssr: false })` — Leaflet touches `window` at import.
       * A list that lived inside it would be just as client-only as the map
       * itself, defeating the point: a screen reader that hasn't finished
       * loading JS, or a crawler, would see nothing here either. This server
       * component has the same `places`/`umkm` data already, so the list
       * costs nothing extra to compute and always ships in the initial HTML.
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
