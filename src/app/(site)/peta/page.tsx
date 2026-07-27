import type { Metadata } from "next";
import Image from "next/image";
import { PageHeading } from "@/components/layout/PageHeading";
import { PlaceExplorer } from "@/components/peta/PlaceExplorer";
import { imageProps } from "@/lib/sanity/image";
import { client } from "@/lib/sanity/client";
import { placesQuery, siteSettingsQuery } from "@/lib/sanity/queries";
import type { Place, SiteSettings } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Peta & Tempat Publik",
  description:
    "Peta Kelurahan Sidoharjo beserta daftar tempat umum: kantor pemerintahan, masjid, sekolah, dan toko.",
  alternates: { canonical: "/peta" },
};

export default async function PetaPage() {
  const [settings, places] = await Promise.all([
    client.fetch<SiteSettings | null>(siteSettingsQuery),
    client.fetch<Place[]>(placesQuery),
  ]);

  const map = imageProps(settings?.kelurahanMapImage);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Peta &amp; Tempat Publik</PageHeading>

      {/* Map slightly narrower than the list on desktop; stacks with the map on
          top on mobile, matching both frames. */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[5fr_6fr]">
        <div className="rounded-3xl bg-white/30 p-3 shadow-sm">
          {map ? (
            <div className="overflow-hidden rounded-2xl">
              <Image
                {...map}
                alt="Peta Kelurahan Sidoharjo"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-auto w-full"
              />
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-muted text-xs sm:text-sm text-muted-foreground">
              Peta belum diunggah.
            </div>
          )}
        </div>

        <PlaceExplorer places={places} />
      </div>
    </div>
  );
}
