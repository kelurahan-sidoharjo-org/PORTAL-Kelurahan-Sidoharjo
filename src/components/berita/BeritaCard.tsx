import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { formatDateLong } from "@/lib/format";
import { imageProps } from "@/lib/sanity/image";
import type { PostSummary } from "@/lib/sanity/types";
import { cn } from "@/lib/utils";

/**
 * Dipakai oleh /berita dan baris "Berita Kelurahan" di beranda.
 *
 * Sengaja dipisah dari PrestasiCard: yang itu menampilkan hari+bulan
 * (tahunnya jadi judul timeline) dan punya varian trophy saat tanpa cover.
 * Menggabungkan keduanya berarti satu komponen dengan dua mode yang tidak
 * saling terkait.
 */
export function BeritaCard({
  post,
  className,
}: {
  post: PostSummary;
  /** Cuma untuk layout — carousel di beranda mengukur item berbeda dari grid. */
  className?: string;
}) {
  const cover = imageProps(post.coverImage);

  return (
    <li
      className={cn(
        // `relative` menjadi jangkar untuk link yang diregangkan di bawah,
        // yang membuat seluruh kartu bisa diketuk. `group` membuat hover di
        // bagian mana pun mewarnai link-nya.
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      {/*
       * 3/5 gambar, 2/5 teks. Dipisah dengan flex-basis, bukan aspect ratio
       * tetap, supaya proporsinya bertahan berapa pun tinggi yang diambil
       * barisnya — grid dan flex sama-sama meregangkan tiap kartu mengikuti
       * yang paling tinggi, jadi gambarnya sejajar sepanjang baris walau
       * judulnya beda panjang.
       */}
      {/* Batas min-h: tanpa cover div-nya kosong, dan basis persentase dari
          baris yang tingginya mengikuti konten akan mengempiskannya jadi
          nol (terlihat di carousel mobile, di mana tidak ada apa pun lagi
          yang menentukan tingginya). */}
      <div className="relative min-h-40 basis-3/5 bg-muted">
        {cover && (
          <Image
            {...cover}
            alt={post.title}
            sizes="(min-width: 1024px) 30vw, 100vw"
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="flex basis-2/5 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold text-brand-navy sm:text-lg">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-3 text-xs sm:text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          {/*
           * after:absolute after:inset-0 meregangkan overlay tak terlihat ke
           * seluruh kartu, jadi mengetuk di mana pun membuka artikelnya —
           * sambil tetap menjaga cuma ada satu <a> sungguhan di markup.
           * Membungkus kartunya dengan link malah akan bikin <a> bersarang
           * di dalam <a>, yang tidak valid.
           */}
          <Link
            href={`/berita/${post.slug}`}
            className="inline-flex items-center gap-2 font-heading text-xs sm:text-sm font-semibold after:absolute after:inset-0 group-hover:text-brand"
          >
            lihat lebih lanjut
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium   text-muted-foreground">
            <Calendar className="size-3.5" aria-hidden />
            {formatDateLong(post.publishedAt)}
          </span>
        </div>
      </div>
    </li>
  );
}
