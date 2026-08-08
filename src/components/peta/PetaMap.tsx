"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Place, Umkm } from "@/lib/sanity/types";

const PetaMapCanvas = dynamic(() => import("./PetaMapCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-full place-items-center bg-muted text-xs sm:text-sm text-muted-foreground"
      role="status"
    >
      Memuat peta…
    </div>
  ),
});

/**
 * /peta's single interactive map. Leaflet touches `window`, so the map itself
 * only ever loads client-side (`ssr: false`) — this outer shell renders
 * instantly on the server and holds the one piece of state that has to live
 * above the map: the search text, so the box itself never waits on the
 * Leaflet chunk to appear.
 *
 * Everything else — the legend, which categories are hidden, fitting the
 * camera — lives inside PetaMapCanvas, since none of it can exist before
 * Leaflet does anyway.
 */
export function PetaMap({ places, umkm }: { places: Place[]; umkm: Umkm[] }) {
  const [query, setQuery] = useState("");

  return (
    // svh, not vh — same reason as pemerintah-kelurahan/page.tsx: 100vh on a
    // mobile browser counts the space behind its address bar, which would
    // push the legend below the visible viewport at sm: and up.
    <div className="flex h-[52svh] flex-col gap-6 sm:h-[90svh] sm:gap-8">
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari Tempat Umum"
          aria-label="Cari tempat umum"
          className="w-full bg-transparent text-sm outline-none sm:text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl shadow-sm">
        <PetaMapCanvas places={places} umkm={umkm} query={query} />
      </div>
    </div>
  );
}
