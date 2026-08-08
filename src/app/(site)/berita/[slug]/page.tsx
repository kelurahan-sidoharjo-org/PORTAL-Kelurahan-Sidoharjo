import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { PortableBody } from "@/components/berita/PortableBody";
import { BackButton } from "@/components/layout/BackButton";
import { formatDateLong } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/client";
import { imageProps, urlFor } from "@/lib/sanity/image";
import { allPostSlugsQuery, postBySlugQuery } from "@/lib/sanity/queries";
import type { PostDetail } from "@/lib/sanity/types";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

/**
 * Setiap post, kedua kategori — artikel Prestasi juga berada di route
 * ini. Memfilter ke `berita` di sini akan membuat 404 setiap kartu Prestasi.
 */
export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allPostSlugsQuery);
  return slugs.map((slug) => ({ slug }));
}

async function getPost(slug: string) {
  return sanityFetch<PostDetail | null>(postBySlugQuery, { slug });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Tidak ditemukan" };

  /**
   * Artikel adalah yang sebenarnya dibagikan — kebanyakan ditempel ke grup
   * WhatsApp desa — dan tautan tanpa gambar preview terbaca rusak atau
   * mencurigakan. Foto cover-nya sudah ada di Sanity, jadi ini meminta CDN-
   * nya untuk crop 1200x630 (ukuran yang diharapkan tiap platform), alih-
   * alih mengirim aset terpisah.
   */
  const ogImage = post.coverImage
    ? urlFor(post.coverImage).width(1200).height(630).fit("crop").url()
    : undefined;

  const description = post.excerpt ?? undefined;

  return {
    // Suffix comes from the title template in the root layout.
    title: post.title,
    description,
    alternates: { canonical: `/berita/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt,
      url: `/berita/${slug}`,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  /**
   * Dijangkau lewat alamat yang pernah dipakai artikel ini, sebelum
   * judulnya diedit — postBySlugQuery juga mencocokkan `previousSlugs`.
   * Redirect permanen ke alamat yang dibawanya sekarang: tautan yang
   * dibagikan tetap berfungsi, dan Google menggabungkan keduanya alih-alih
   * mengindeks satu artikel di dua alamat.
   */
  if (post.slug !== slug) permanentRedirect(`/berita/${post.slug}`);

  const cover = imageProps(post.coverImage);
  // flatMap alih-alih map+filter supaya `props` menyempit jadi non-null.
  const gallery = (post.images ?? []).flatMap((image) => {
    const props = imageProps(image);
    return props ? [props] : [];
  });

  // Artikel Prestasi dijangkau dari /prestasi, jadi kirim pembaca kembali ke sana.
  const backHref = post.category === "prestasi" ? "/prestasi" : "/berita";

  return (
    <article>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <BackButton href={backHref} />
      </div>

      {/* max-w dan padding yang sama dengan BackButton di atas, supaya
          keduanya berbagi tepi kiri. Ubah salah satu, ubah juga yang lain. */}
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="flex items-center gap-2 font-heading text-xs sm:text-sm font-bold">
          <Calendar className="size-4" aria-hidden />
          {formatDateLong(post.publishedAt)}
        </p>

        <h1 className="mt-2 text-xl sm:text-4xl">{post.title}</h1>
      </div>

      {cover && (
        <Image
          {...cover}
          // Alt kosong: judulnya sudah ada tepat di atas, jadi menamai
          // fotonya lagi cuma akan mengulanginya ke screen reader.
          alt=""
          priority
          sizes="100vw"
          className="aspect-[16/7] w-full object-cover"
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PortableBody value={post.body} />

        {gallery.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg sm:text-3xl">Dokumentasi Kegiatan</h2>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gallery.map((props, i) => (
                <li key={props.src}>
                  <Image
                    {...props}
                    alt={`${post.title} — dokumentasi ${i + 1}`}
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
