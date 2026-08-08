"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

/** Lama menunggu setelah ketukan terakhir sebelum bertanya ke Sanity. */
const DEBOUNCE_MS = 300;

/**
 * Kotak pencarian /berita — sama seperti di PetaMap, tugas beda di
 * baliknya. PetaMap sudah punya semua data di browser dan memfilter di
 * memori; /berita cuma menyimpan satu halaman post, jadi pencariannya
 * harus menjangkau Sanity.
 *
 * Mengetik memperbarui alamat (`/berita?q=…`) dan server query ulang.
 * Alamatnya jadi sumber kebenaran: hasil tetap bisa dibagikan, bertahan
 * setelah reload, dan tombol Back berperilaku benar.
 */
export function BeritaSearch({ value }: { value: string }) {
  const router = useRouter();
  // State lokal supaya mengetik terasa instan berapa pun lambatnya round-trip-nya.
  const [text, setText] = useState(value);
  const [isPending, startTransition] = useTransition();

  /**
   * Alamatnya otoritatif, harus menang saat berubah dari luar (Back,
   * tautan yang dibagikan). Sinkronisasi murni dari `value` akan
   * berbenturan dengan ketikan; ref-nya melacak apa yang terakhir kita
   * kirim, jadi cuma perubahan dari luar yang menang.
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
      // Sengaja tanpa `page`: pencarian baru mulai dari halaman 1.
      const query = params.toString();

      startTransition(() => {
        // `replace`, bukan `push` — Back tidak boleh mundur lewat tiap
        // ketukan tuts. `scroll: false` menjaga posisi pembaca.
        router.replace(query ? `/berita?${query}` : "/berita", {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, router]);

  return (
    /*
     * Form GET sungguhan, supaya pencarian tetap jalan tanpa JavaScript.
     * Dengan JavaScript, submit-nya dibatalkan karena debounce sudah
     * melakukan navigasi — sama seperti Pagination.
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

        {/* Cuma muncul kalau ada yang bisa dihapus. Tombol, bukan link:
            menghapus lewat jalur debounce yang sama seperti mengetik. */}
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
