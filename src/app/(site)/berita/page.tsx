import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeritaCard } from "@/components/berita/BeritaCard";
import { Pagination } from "@/components/berita/Pagination";
import { PageHeading } from "@/components/layout/PageHeading";
import { getPageInfo, parsePageParam } from "@/lib/pagination";
import { client } from "@/lib/sanity/client";
import { beritaCountQuery, beritaListQuery } from "@/lib/sanity/queries";
import type { PostSummary } from "@/lib/sanity/types";

export const revalidate = 3600;

// Suffix comes from the title template in the root layout.
export const metadata: Metadata = {
  title: "Berita Kelurahan",
  description:
    "Kabar, pengumuman, dan kegiatan terbaru dari Kelurahan Sidoharjo.",
  alternates: { canonical: "/berita" },
};

export default async function BeritaPage({
  searchParams,
}: {
  // Next 16 hands these over as a Promise.
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const page = parsePageParam((await searchParams).page);
  if (page === null) notFound();

  const total = await client.fetch<number>(beritaCountQuery);
  const info = getPageInfo(page, total);

  // Deep-linking past the last page is a dead end, not an empty grid.
  if (page > info.totalPages) notFound();

  const posts = await client.fetch<PostSummary[]>(beritaListQuery, {
    start: info.start,
    end: info.end,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Berita Kelurahan</PageHeading>

      {posts.length > 0 ? (
        <>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BeritaCard key={post._id} post={post} />
            ))}
          </ul>
          <Pagination info={info} />
        </>
      ) : (
        <p className="mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          Belum ada berita yang dipublikasikan.
        </p>
      )}
    </div>
  );
}
