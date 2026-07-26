"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  filterPlaces,
  PLACES_PER_PAGE,
  presentCategories,
} from "@/lib/places";
import { getPageInfo } from "@/lib/pagination";
import type { Place, PlaceCategory } from "@/lib/sanity/types";
import { PlaceCard } from "./PlaceCard";
import { PlacePagination } from "./PlacePagination";

/**
 * The interactive right-hand column of /peta: a name search and category filter
 * pills over the place list. The data arrives already fetched from the server
 * page; only the narrowing happens here, in the browser.
 */
export function PlaceExplorer({ places }: { places: Place[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "semua">("semua");
  const [page, setPage] = useState(1);

  // Only categories that actually have places get a pill (plus "Semua").
  const categories = useMemo(() => presentCategories(places), [places]);
  const visible = useMemo(
    () => filterPlaces(places, { query, category }),
    [places, query, category],
  );

  // Changing the search or filter shows a different, usually shorter, list, so
  // both handlers jump back to page 1 — done here in the event rather than in an
  // effect, which would trigger an extra cascading render.
  function search(next: string) {
    setQuery(next);
    setPage(1);
  }
  function selectCategory(next: PlaceCategory | "semua") {
    setCategory(next);
    setPage(1);
  }

  // Clamp during render as a guard: if `places` changes under us, page could
  // point past the end, and slicing there would flash an empty grid.
  const info = getPageInfo(page, visible.length, PLACES_PER_PAGE);
  const pageInfo =
    page <= info.totalPages
      ? info
      : getPageInfo(info.totalPages, visible.length, PLACES_PER_PAGE);
  const pageItems = visible.slice(pageInfo.start, pageInfo.end);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => search(event.target.value)}
          placeholder="Cari Tempat Umum"
          aria-label="Cari tempat umum"
          className="w-full bg-transparent text-sm outline-none sm:text-base"
        />
      </div>

      {/* Horizontal scroll on mobile so pills never wrap into a tall block;
          wraps normally from sm: up. */}
      <div className="mt-4 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
        <FilterPill
          active={category === "semua"}
          onClick={() => selectCategory("semua")}
        >
          Semua
        </FilterPill>
        {categories.map((c) => (
          <FilterPill
            key={c}
            active={category === c}
            onClick={() => selectCategory(c)}
          >
            {categoryLabel(c)}
          </FilterPill>
        ))}
      </div>

      {places.length === 0 ? (
        <p className="mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          Belum ada tempat yang terdaftar.
        </p>
      ) : visible.length > 0 ? (
        <>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {pageItems.map((place) => (
              <PlaceCard key={place._id} place={place} />
            ))}
          </ul>
          <PlacePagination info={pageInfo} onPage={setPage} />
        </>
      ) : (
        <p className="mt-8 text-center text-xs sm:text-sm text-muted-foreground">
          Tidak ada tempat yang cocok.
        </p>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors",
        active
          ? "bg-brand text-white"
          : "bg-brand/10 text-brand hover:bg-brand/20",
      )}
    >
      {children}
    </button>
  );
}
