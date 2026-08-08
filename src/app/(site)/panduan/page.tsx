import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { Markdown } from "@/components/panduan/Markdown";
import { siteUrl } from "@/lib/site";

/**
 * Panduan staf, disajikan dari docs/panduan-staf.md.
 *
 * Ada sebagai halaman karena staf tidak punya cara realistis membaca
 * file di repo GitHub. Satu sumber kebenaran: edit Markdown-nya, halaman
 * mengikuti.
 *
 * Publik tapi tidak terdaftar — tanpa login, tapi `noindex` dan tidak
 * ada di sitemap.ts karena ini instruksi internal, bukan konten warga.
 */

// Di-prerender saat build — dibaca sekali, dipanggang ke HTML statis,
// tanpa akses filesystem saat request. File yang pindah/ganti nama
// membuat build gagal jelas, lebih baik dari 500 diam-diam di produksi.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Panduan Staf",
  description:
    "Panduan penggunaan Ruang Kerja (Studio) untuk perangkat Kelurahan Sidoharjo.",
  robots: { index: false, follow: false },
};

/**
 * Panduannya mengutip alamat situs sendiri — terutama tautan `/admin`
 * yang di-bookmark staf. Menggantinya dari `siteUrl` berarti hari ini
 * tertulis vercel.app dan domain sungguhan setelah cutover, tanpa diedit.
 *
 * Token eksplisit, bukan placeholder alami: kalau kalimatnya ditulis
 * ulang, `{{SITE_URL}}` tetap menonjol, dan yang terlewat langsung
 * terlihat di halaman.
 */
const SITE_URL_TOKEN = /\{\{SITE_URL\}\}/g;

export default async function PanduanPage() {
  const raw = await readFile(
    join(process.cwd(), "docs", "panduan-staf.md"),
    "utf8",
  );
  const source = raw.replace(SITE_URL_TOKEN, siteUrl);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>Panduan Staf</PageHeading>
      <article className="mt-8">
        <Markdown source={source} />
      </article>
    </div>
  );
}
