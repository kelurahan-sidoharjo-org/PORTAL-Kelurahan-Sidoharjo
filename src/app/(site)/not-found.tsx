import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false, follow: false },
};

/**
 * Menangkap tiap `notFound()` yang dilempar di dalam grup (site) — slug
 * artikel yang tidak dikenal, atau nomor halaman `/berita` yang melewati
 * batas. Otomatis mewarisi Header, Footer, dan gradien halaman dari layout.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Halaman Tidak Ditemukan</PageHeading>

      <div className="mt-12 flex flex-col items-center gap-6 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-heading text-xs sm:text-sm font-bold text-white transition-shadow hover:shadow-md"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
