import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/layout/PageHeading";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false, follow: false },
};

/**
 * Catches every `notFound()` thrown inside the (site) group — an unknown
 * article slug, or a `/berita` page number past the end. Inherits Header,
 * Footer, and the page gradient from the layout automatically.
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
