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
 * Peta interaktif tunggal di /peta. Leaflet menyentuh `window`, jadi
 * cuma dimuat client-side (`ssr: false`) — shell ini merender instan di
 * server dan menyimpan satu state yang harus di atas peta: teks
 * pencarian, supaya kotaknya tidak menunggu chunk Leaflet.
 *
 * Sisanya — legenda, kategori tersembunyi, kamera — di PetaMapCanvas,
 * karena tidak satu pun bisa ada sebelum Leaflet ada.
 */
export function PetaMap({ places, umkm }: { places: Place[]; umkm: Umkm[] }) {
  const [query, setQuery] = useState("");

  return (
    // svh, bukan vh — alasan yang sama dengan pemerintah-kelurahan/page.tsx:
    // 100vh di browser mobile menghitung ruang di balik address bar-nya,
    // yang akan mendorong legenda ke bawah viewport yang terlihat pada sm: ke atas.
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
