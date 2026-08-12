import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { formatDateLong } from "@/lib/format";
import { imageFillProps } from "@/lib/sanity/image";
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
  const cover = imageFillProps(post.coverImage);

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
       * Tinggi gambar = aspect ratio tetap dari lebar kartu, jadi tidak
       * dipengaruhi dimensi foto aslinya dan tidak ikut memanjang saat
       * judulnya panjang. `shrink-0` menahannya dari diperas ketika kartu
       * diberi tinggi paksa dari luar.
       *
       * `fill` wajib, bukan pilihan gaya. Tanpa itu <Image> tetap elemen
       * yang mengalir normal, jadi tinggi aslinya ikut dihitung sebagai isi
       * div ini dan foto potret mengembungkan kartunya melewati bingkai
       * 16:10. `fill` memposisikannya absolut menutupi div — `relative` di
       * sini yang jadi acuannya — jadi gambarnya tidak punya suara atas
       * tinggi kartu, cuma object-cover yang memotong.
       */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
        {cover && (
          <Image
            {...cover}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      {/*
       * Blok teks juga tingginya pasti: judul dijatah 2 baris, ringkasan 3
       * baris — clamp membuang kelebihannya, min-h menahan jatah itu tetap
       * ada waktu teksnya pendek (atau ringkasannya kosong). Satuan `lh` =
       * line-height elemen itu sendiri, jadi jatahnya ikut membesar sendiri
       * di breakpoint sm: tanpa angka rem kedua yang harus disetel manual.
       */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 min-h-[2lh] text-base font-semibold text-brand-navy sm:text-lg">
          {post.title}
        </h3>
        <p className="line-clamp-3 min-h-[3lh] text-xs sm:text-sm text-muted-foreground">
          {post.excerpt}
        </p>

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
