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
            /* Baris yang bisa di-swipe dengan kartu berikutnya mengintip,
               berubah jadi grid tiga-berjajar seperti mockup di lg:.
               Scroll-snap CSS murni — tanpa library carousel dan tanpa
               client component.

               Grid-nya menunggu sampai lg: karena beranda selalu
               menampilkan tepat tiga post, dan tiga tidak pernah terbagi
               rata jadi dua kolom: langkah dua-kolom akan menyisakan kartu
               ketiga di sebelah sel kosong di tiap lebar dari 640px sampai
               1023px — tablet, dan jendela laptop mana pun yang belum
               dimaksimalkan. Tidak ada mockup yang punya kondisi dua-kolom;
               keduanya langsung dari carousel ke tiga-berjajar, dan
               carousel itulah yang menutup lebar-lebar di antaranya. */
            <ul className="-mx-5 mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-pl-5 px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
              {posts.map((post) => (
                <BeritaCard
                  key={post._id}
                  post={post}
                  /*
                   * Tinggi eksplisit selama masih carousel: pembagian gambar
                   * 3/5 pada kartu adalah persentase, dan persentase dari
                   * tinggi yang diturunkan dari konten bersifat sirkular —
                   * browser menyerah dan tiap gambar jatuh balik ke ukuran
                   * aslinya, jadi kartu-kartunya jadi tidak rata. Grid di
                   * lg: mendapat tinggi pasti dari barisnya, jadi h-full
                   * sudah cukup di situ.
                   *
                   * Width punya tiga tugas. `w-[72%]` mengatur intipan di
                   * HP; `sm:w-80` membatasinya begitu viewport cukup lebar
                   * sehingga 72% akan jadi slab 470px yang cuma menampilkan
                   * hampir satu kartu. `lg:min-w-0` melepas batas bawahnya
                   * untuk grid — di 1024px satu kolom sekitar 283px, jadi
                   * minimum 320px akan mendorong kartu-kartunya keluar dari selnya sendiri.
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

      {/* Cuma dirender saat heroVideoUrl berhasil di-parse — tempelan yang
          salah tidak menampilkan apa pun, bukan pemutar yang rusak. */}
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
