import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeritaCard } from "@/components/berita/BeritaCard";
import { LayananNav } from "@/components/home/LayananNav";
import { sanityFetch } from "@/lib/sanity/client";
import { latestPostsQuery, siteSettingsQuery } from "@/lib/sanity/queries";
import type { PostSummary, SiteSettings } from "@/lib/sanity/types";
import { toEmbedUrl } from "@/lib/youtube";

export const revalidate = 3600;

export default async function Home() {
  const [settings, posts] = await Promise.all([
    sanityFetch<SiteSettings | null>(siteSettingsQuery),
    sanityFetch<PostSummary[]>(latestPostsQuery),
  ]);

  const embedUrl = toEmbedUrl(settings?.heroVideoUrl);

  return (
    <>
      <LayananNav />

      {/* Full-bleed on mobile — the panel runs edge to edge, so it drops its
          side padding and corner radius there and regains both from sm: up. */}
      <section className="mx-auto max-w-6xl sm:px-6">
        <div className="bg-white/50 p-5 shadow-sm sm:rounded-3xl sm:p-10">
          {/* Mobile: heading left, link right. Desktop: heading centred with
              the link pinned to the right edge. */}
          <div className="relative flex items-center justify-between gap-3">
            <h2 className="text-lg sm:w-full sm:text-center sm:text-2xl">
              Berita Terbaru
            </h2>
            <Link
              href="/berita"
              className="inline-flex shrink-0 items-center gap-2 text-xs sm:text-sm font-semibold hover:text-brand sm:absolute sm:right-0 hover:underline hover:underline-offset-4 hover:drop-shadow-lg"
            >
              lihat semua
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {posts.length > 0 ? (
            /* Mobile is a swipeable row with the next card peeking in; from
               sm: up it becomes a normal grid. Pure CSS scroll-snap — no
               carousel library and no client component. */
            <ul className="-mx-5 mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {posts.map((post) => (
                <BeritaCard
                  key={post._id}
                  post={post}
                  /*
                   * Explicit height on mobile: the card's 3/5-image split is a
                   * percentage, and a percentage of a content-derived height is
                   * circular — the browser gives up and each image falls back
                   * to its own natural size, so cards end up uneven. The grid
                   * at sm: gets a definite height from the row, so h-full is
                   * enough there.
                   */
                  className="h-[22rem] w-[72%] shrink-0 snap-start sm:h-full sm:w-auto"
                />
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-xs sm:text-sm text-muted-foreground">
              Belum ada berita yang dipublikasikan.
            </p>
          )}
        </div>
      </section>

      {/* Only rendered when heroVideoUrl parses — a bad paste shows nothing
          rather than a broken player. */}
      {embedUrl && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-lg sm:text-center sm:text-2xl">Video Profil</h2>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              src={embedUrl}
              title="Video profil kelurahan"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        </section>
      )}
    </>
  );
}
