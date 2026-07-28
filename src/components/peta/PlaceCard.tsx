import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Place } from "@/lib/sanity/types";

/**
 * One public place: a mint icon square, the name, and a "lihat peta" button to
 * Google Maps. The icon is resolved mechanically from the category —
 * `ic-place-<category>.png` — so there's no mapping table to keep in sync.
 */
export function PlaceCard({ place }: { place: Place }) {
  return (
    <li className="flex sm:flex-col rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-lg gap-2">
      <div className="flex w-full items-center gap-2 min-w-0">
        <Image
          src={`/images/ic-place-${place.category}.png`}
          alt=""
          width={24}
          height={24}
          unoptimized
          className="object-cover"
        />

        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-navy sm:text-base">
          {place.name}
        </h2>
      </div>

      <a
        href={place.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex justify-center shrink-0 items-center gap-1 rounded-lg border border-black/15 px-2 py-2 text-xs font-medium transition-colors hover:bg-black/5"
      >
        <MapPin className="size-4" aria-hidden />
        lihat peta
      </a>
    </li>
  );
}
