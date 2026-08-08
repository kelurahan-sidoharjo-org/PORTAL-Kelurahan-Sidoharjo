import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeritaCard } from "@/components/berita/BeritaCard";
import { LayananNav } from "@/components/home/LayananNav";
import { getSiteSettings, sanityFetch } from "@/lib/sanity/client";
import { latestPostsQuery } from "@/lib/sanity/queries";
import type { PostSummary } from "@/lib/sanity/types";
import { toEmbedUrl } from "@/lib/youtube";

export const revalidate = 3600;

export default async function Home() {
  const [settings, posts] = await Promise.all([
    getSiteSettings(),
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
            /* A swipeable row with the next card peeking in, becoming the
               mockup's three-across grid at lg:. Pure CSS scroll-snap — no
               carousel library and no client component.

               The grid waits for lg: because the homepage always shows exactly
               three posts, and three never divides evenly into two columns: a
               two-column step would strand the third card beside an empty
               cell at every width from 640px to 1023px — tablets, and any
               un-maximised laptop window. Neither mockup has a two-column
               state; they go straight from carousel to three-across, and the
               carousel is what covers the widths in between. */
            <ul className="-mx-5 mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
              {posts.map((post) => (
                <BeritaCard
                  key={post._id}
                  post={post}
                  /*
                   * Explicit height while it's a carousel: the card's 3/5-image
                   * split is a percentage, and a percentage of a content-derived
                   * height is circular — the browser gives up and each image
                   * falls back to its own natural size, so cards end up uneven.
                   * The grid at lg: gets a definite height from the row, so
                   * h-full is enough there.
                   *
                   * Width has three jobs. `w-[72%]` sets the phone peek;
                   * `sm:w-80` caps it once the viewport is wide enough that 72%
                   * would be a 470px slab showing barely one card. `lg:min-w-0`
                   * releases the floor for the grid — at 1024px a column is
                   * ~283px, so a 320px minimum would push the cards out of
                   * their own cells.
                   */
                  className="h-[22rem] w-[72%] min-w-[20rem] shrink-0 snap-start sm:w-80 lg:h-full lg:w-auto lg:min-w-0"
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
