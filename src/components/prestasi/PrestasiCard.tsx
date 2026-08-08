import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { formatDayMonth } from "@/lib/format";
import { imageProps } from "@/lib/sanity/image";
import type { PostSummary } from "@/lib/sanity/types";

/**
 * Dua bentuk: dengan foto cover, gambarnya di atas; tanpa foto, jatuh balik
 * ke ubin trophy di sebelah judul.
 *
 * Pengganti yang dipakai adalah ic-trophy (glyph putih di hijau tua),
 * BUKAN trophy indigo-di-atas-lavender di frame Figma — aset ketiga itu
 * sengaja dibuang. Lihat CLAUDE.md.
 */
export function PrestasiCard({ post }: { post: PostSummary }) {
  const cover = imageProps(post.coverImage);
  // Tahunnya sudah jadi judul timeline, jadi kartunya menampilkan hari + bulan.
  const date = formatDayMonth(post.publishedAt);
  const href = `/berita/${post.slug}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow sm:max-w-sm sm:ml-10 hover:shadow-lg">
      {cover && (
        <Image
          {...cover}
          alt={post.title}
          sizes="(min-width: 1024px) 520px, 100vw"
          className="aspect-[16/9] w-full object-cover"
        />
      )}

      <div className="p-5">
        {cover ? (
          <>
            <DateLine date={date} />
            <h3 className="mt-1 text-sm font-bold text-brand-navy sm:text-lg">
              {post.title}
            </h3>
          </>
        ) : (
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand/10">
              <Image
                src="/images/ic-trophy.png"
                alt=""
                width={40}
                height={40}
                unoptimized
                className="size-9"
              />
            </span>
            <div className="min-w-0">
              <DateLine date={date} />
              <h3 className="mt-1 text-sm font-bold text-brand-navy sm:text-lg">
                {post.title}
              </h3>
            </div>
          </div>
        )}

        {post.excerpt && (
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">{post.excerpt}</p>
        )}

        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-2 font-heading text-xs sm:text-sm font-bold hover:text-brand"
        >
          lihat lebih lanjut
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function DateLine({ date }: { date: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Calendar className="size-3.5" aria-hidden />
      {date}
    </p>
  );
}
