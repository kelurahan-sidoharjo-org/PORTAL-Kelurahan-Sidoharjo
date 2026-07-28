import type { Metadata } from "next";
import Image from "next/image";
import { PageHeading } from "@/components/layout/PageHeading";
import { PrestasiCard } from "@/components/prestasi/PrestasiCard";
import { groupByYear } from "@/lib/format";
import { client } from "@/lib/sanity/client";
import { prestasiListQuery } from "@/lib/sanity/queries";
import type { PostSummary } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Prestasi Kelurahan",
  description:
    "Penghargaan dan capaian Kelurahan Sidoharjo dari tahun ke tahun.",
  alternates: { canonical: "/prestasi" },
};

export default async function PrestasiPage() {
  const posts = await client.fetch<PostSummary[]>(prestasiListQuery);
  const years = groupByYear(posts, (post) => post.publishedAt);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Prestasi Kelurahan</PageHeading>

      {years.length > 0 ? (
        <div className="mt-12 sm:ml-17">
          {years.map(({ year, items }) => (
            <section key={year} className="relative pb-10 sm:pl-8">
              {/* The vertical rail, drawn per-group so it never runs past the
                  final card. Hidden on mobile, where cards are full width. */}
              <span
                aria-hidden
                className="absolute bottom-0 left-5 top-10 hidden w-px bg-black/10 sm:block"
              />

              <h2 className="relative flex items-center gap-4">
                <span className="sm:-ml-7">
                  <Image
                    src="/images/ic-trophy.png"
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="object-cover sm:size-9"
                  />
                </span>
                <span className="font-heading text-xl sm:text-3xl font-bold">
                  {year}
                </span>
              </h2>

              <div className="mt-5 space-y-5 sm:pl-6">
                {items.map((post) => (
                  <PrestasiCard key={post._id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          Belum ada prestasi yang dipublikasikan.
        </p>
      )}
    </div>
  );
}
