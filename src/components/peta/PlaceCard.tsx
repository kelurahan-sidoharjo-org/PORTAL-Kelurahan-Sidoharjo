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
    <li className="flex items-center rounded-2xl bg-white p-3 shadow-sm transition-shadow hover:shadow-lg gap-2 p-3">
      <Image
        src={`/images/ic-place-${place.category}.png`}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="size-7 object-contain"
      />

      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-navy sm:text-base">
        {place.name}
      </h2>

      <a
        href={place.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-black/15 px-2 py-2 text-xs font-medium transition-colors hover:bg-black/5"
      >
        <MapPin className="size-4" aria-hidden />
        lihat peta
      </a>
    </li>
  );
}
