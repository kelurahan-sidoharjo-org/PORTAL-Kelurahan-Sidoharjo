import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeritaCard } from "@/components/berita/BeritaCard";
import { BeritaSearch } from "@/components/berita/BeritaSearch";
import { Pagination } from "@/components/berita/Pagination";
import { PageHeading } from "@/components/layout/PageHeading";
import { getPageInfo, parsePageParam } from "@/lib/pagination";
import { searchValue, toMatchPattern } from "@/lib/search";
import { sanityFetch } from "@/lib/sanity/client";
import { beritaCountQuery, beritaListQuery } from "@/lib/sanity/queries";
import type { PostSummary } from "@/lib/sanity/types";

export const revalidate = 3600;

// Next 16 menyerahkan kedua param sebagai Promise.
type SearchParams = Promise<{ page?: string | string[]; q?: string | string[] }>;

// Sufiks berasal dari template judul di root layout.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const searching = toMatchPattern((await searchParams).q) !== null;

  return {
    title: "Berita Kelurahan",
    description:
      "Kabar, pengumuman, dan kegiatan terbaru dari Kelurahan Sidoharjo.",
    alternates: { canonical: "/berita" },
    /**
     * Halaman hasil pencarian cuma potongan tipis dari artikel yang sudah
     * diindeks Google satu per satu, jadi ia jadi noise di indeks — tapi
     * tautan di dalamnya tetap layak diikuti. `follow: true` menjaga
     * perbedaan itu.
     */
    ...(searching && { robots: { index: false, follow: true } }),
  };
}

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const page = parsePageParam(params.page);
  if (page === null) notFound();

  // null berarti "tidak sedang mencari" — query membacanya sebagai tanpa filter sama sekali.
  const pattern = toMatchPattern(params.q);
  const query = searchValue(params.q);

  const total = await sanityFetch<number>(beritaCountQuery, { q: pattern });
  const info = getPageInfo(page, total);

  // Deep-link melewati halaman terakhir adalah jalan buntu, bukan grid kosong.
  if (page > info.totalPages) notFound();

  const posts = await sanityFetch<PostSummary[]>(beritaListQuery, {
    start: info.start,
    end: info.end,
    q: pattern,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Berita Kelurahan</PageHeading>

      <BeritaSearch value={query} />

      {posts.length > 0 ? (
        <>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BeritaCard key={post._id} post={post} />
            ))}
          </ul>
          <Pagination info={info} query={query} />
        </>
      ) : (
        /* Dua "tidak ada" yang berbeda: pencarian kosong adalah perbuatan
           pembaca dan mereka bisa memperbaikinya, arsip kosong adalah
           perbuatan kelurahan. */
        <p className="mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          {pattern
            ? "Tidak ada berita yang cocok."
            : "Belum ada berita yang dipublikasikan."}
        </p>
      )}
    </div>
  );
}
