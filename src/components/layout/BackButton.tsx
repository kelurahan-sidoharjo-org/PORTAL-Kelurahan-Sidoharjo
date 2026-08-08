"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Kontrol "← Kembali" di kiri atas tiap halaman internal. Teks polos di
 * mobile, pil putih dari `sm:` ke atas.
 *
 * Kembali lewat riwayat browser kalau ada, supaya pembaca yang membuka
 * artikel dari beranda kembali ke beranda, bukan ke /berita. `href` tetap
 * jadi tujuan sesungguhnya di markup — tombol tetap jalan tanpa JavaScript.
 */
export function BackButton({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        // Klik yang dimodifikasi (buka tab baru, dll.) harus tetap
        // menjalankan perilaku bawaannya.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-heading text-xs sm:text-sm font-bold transition-shadow hover:text-brand sm:bg-white/30 sm:px-5 sm:py-2.5 sm:shadow-sm sm:hover:shadow-md",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Kembali
    </Link>
  );
}
