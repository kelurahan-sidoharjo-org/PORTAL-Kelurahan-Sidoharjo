import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeritaCard } from "@/components/berita/BeritaCard";
import { BeritaSearch } from "@/components/berita/BeritaSearch";
import { Pagination } from "@/components/berita/Pagination";
import { PageHeading } from "@/components/layout/PageHeading";
import { getPageInfo, parsePageParam } from "@/lib/pagination";
import { searchValue, toMatchPattern } from "@/lib/search";
import { client } from "@/lib/sanity/client";
import { beritaCountQuery, beritaListQuery } from "@/lib/sanity/queries";
import type { PostSummary } from "@/lib/sanity/types";

export const revalidate = 3600;

// Next 16 hands both params over as a Promise.
type SearchParams = Promise<{ page?: string | string[]; q?: string | string[] }>;

// Suffix comes from the title template in the root layout.
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
     * A search result page is a thin slice of articles Google already has
     * indexed individually, so it's noise in the index — but the links on it
     * are still worth following. `follow: true` keeps that distinction.
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

  // null means "not searching" — the queries read that as no filter at all.
  const pattern = toMatchPattern(params.q);
  const query = searchValue(params.q);

  const total = await client.fetch<number>(beritaCountQuery, { q: pattern });
  const info = getPageInfo(page, total);

  // Deep-linking past the last page is a dead end, not an empty grid.
  if (page > info.totalPages) notFound();

  const posts = await client.fetch<PostSummary[]>(beritaListQuery, {
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
        /* Two different nothings: an empty search is the reader's doing and
           they can fix it, an empty archive is the kelurahan's. */
        <p className="mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          {pattern
            ? "Tidak ada berita yang cocok."
            : "Belum ada berita yang dipublikasikan."}
        </p>
      )}
    </div>
  );
}
