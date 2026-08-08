"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

/** How long to wait after the last keystroke before asking Sanity. */
const DEBOUNCE_MS = 300;

/**
 * The /berita search box — the same control as the one on PetaMap, doing a
 * different job underneath.
 *
 * PetaMap already holds every place and UMKM in the browser, so it filters in
 * memory. /berita only ever holds one page of posts (CLAUDE.md: "never render
 * all posts"), so searching there has to reach Sanity, or it would search the
 * visible twelve and report "nothing found" for everything older.
 *
 * So typing updates the address (`/berita?q=…`) and the server re-queries. The
 * address, not this component, is the source of truth: results stay shareable,
 * survive a reload, and the Back button behaves.
 */
export function BeritaSearch({ value }: { value: string }) {
  const router = useRouter();
  // Local state so typing is instant no matter how slow the round-trip is.
  const [text, setText] = useState(value);
  const [isPending, startTransition] = useTransition();

  /**
   * The address is authoritative, so it has to win when it changes for reasons
   * this component didn't cause — the clear button on an empty result, a Back
   * navigation, a shared link. Syncing on `value` alone would fight the user's
   * typing; the ref tracks what we last *sent*, so only outside changes win.
   */
  const lastSent = useRef(value);
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (text === lastSent.current) return;

    const timer = setTimeout(() => {
      lastSent.current = text;
      const params = new URLSearchParams();
      if (text.trim()) params.set("q", text.trim());
      // Deliberately no `page`: a new search starts at page 1. Carrying page 4
      // across would land the reader on an empty grid.
      const query = params.toString();

      startTransition(() => {
        // `replace`, not `push` — otherwise Back walks backwards through every
        // keystroke instead of leaving the page. `scroll: false` keeps the
        // reader's place instead of jumping to the top on each keystroke.
        router.replace(query ? `/berita?${query}` : "/berita", {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, router]);

  return (
    /*
     * A real GET form, so the search still works with JavaScript disabled: the
     * browser turns Enter into /berita?q=… by itself. With JavaScript the
     * submit is redundant — the debounce has already navigated — so it's
     * cancelled to avoid a duplicate trip. Same no-JS reasoning as Pagination.
     */
    <form
      action="/berita"
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="mt-8"
    >
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 shadow-sm">
        {isPending ? (
          <LoaderCircle
            className="size-5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : (
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        )}

        <input
          type="search"
          name="q"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Cari Berita"
          aria-label="Cari berita"
          className="w-full bg-transparent text-sm outline-none sm:text-base"
        />

        {/* Only offered once there's something to clear. A button, not a link:
            clearing goes through the same debounced path as typing. */}
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="Hapus pencarian"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-black/5"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}
