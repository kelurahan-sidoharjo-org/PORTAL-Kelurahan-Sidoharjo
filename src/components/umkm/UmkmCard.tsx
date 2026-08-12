import Image from "next/image";
import { MapPin } from "lucide-react";
import { imageFillProps } from "@/lib/sanity/image";
import type { Umkm } from "@/lib/sanity/types";

export function UmkmCard({ item }: { item: Umkm }) {
  const photo = imageFillProps(item.photo);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
      {/*
       * Aspect ratio tetap: tinggi gambar cuma ikut lebar kartu, apa pun
       * dimensi foto yang diunggah staf.
       *
       * `fill` wajib, bukan pilihan gaya. Tanpa itu <Image> tetap elemen
       * yang mengalir normal, jadi tingginya sendiri ikut dihitung sebagai
       * isi div ini — dan foto potret mengembungkan kartunya melewati
       * bingkai 16:10. `fill` membuat Next memposisikannya absolut menutupi
       * div, jadi gambarnya tidak lagi punya suara atas tinggi kartu.
       * `relative` di div inilah yang jadi acuannya.
       */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
        {photo && (
          <Image
            {...photo}
            alt={item.businessName}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/*
         * Jatah baris yang tetap, sama seperti BeritaCard: nama 2 baris,
         * deskripsi 3 baris. `line-clamp` memotong yang kepanjangan,
         * `min-h-[Nlh]` (N × line-height elemen itu sendiri) menahan ruangnya
         * saat teksnya pendek atau deskripsinya kosong — supaya tombolnya
         * sebaris di semua kartu. Karena satuannya line-height, jatahnya ikut
         * naik sendiri waktu font membesar di sm:.
         */}
        <h2 className="line-clamp-2 min-h-[2lh] text-base font-bold text-brand-navy sm:text-lg">
          {item.businessName}
        </h2>
        <p className="line-clamp-3 min-h-[3lh] text-xs sm:text-sm text-muted-foreground">
          {item.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          {item.contactUrl && (
            <a
              href={item.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-brand px-6 py-2.5 text-center font-heading text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Hubungi
            </a>
          )}
          {/* Optional field — the button only exists when staff filled it in. */}
          {item.googleMapsUrl && (
            <a
              href={item.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors hover:bg-black/5"
            >
              <MapPin className="size-4" aria-hidden />
              lihat peta
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
