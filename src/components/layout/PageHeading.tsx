import type { ReactNode } from "react";
import { BackButton } from "./BackButton";

/**
 * Tombol kembali + judul halaman, dipakai bersama halaman daftar.
 *
 * Dua layout sesuai mockup: mobile rata kiri, dari sm: ke atas judulnya
 * dipusatkan dengan tombol kembali tertambat di tepi kiri.
 *
 * Diekstrak karena tiga halaman daftar dulu punya blok ini tempel-salin.
 */
export function PageHeading({
  children,
  backHref,
}: {
  children: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="relative flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
      <div className="sm:absolute sm:left-0">
        <BackButton href={backHref} />
      </div>
      <h1 className="text-lg sm:text-3xl">{children}</h1>
    </div>
  );
}
