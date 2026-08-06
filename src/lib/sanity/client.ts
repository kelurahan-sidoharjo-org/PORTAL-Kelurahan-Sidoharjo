import { cache } from "react";
import { createClient } from "next-sanity";
import type { QueryParams } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";
import { siteSettingsQuery } from "./queries";
import type { SiteSettings } from "./types";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  /**
   * Pembacaan terjadi saat build dan revalidation, bukan per pengunjung, jadi
   * CDN nyaris tidak menghemat apa pun di sini — sementara mengorbankan
   * ketepatan data. Saat webhook publish menembak, CDN Sanity bisa saja masih
   * menyimpan jawaban sebelum publish, sehingga halaman dibangun ulang dengan
   * konten *lama* lalu diam selama satu jam penuh. Tidak ada yang error; staf
   * hanya melihat perubahannya tidak muncul.
   *
   * Langsung ke API menghilangkan masalah itu. `sanityFetch` di bawah ini yang
   * menjaga trafik tambahannya tidak membebani rate limit Sanity.
   */
  useCdn: false,
  perspective: "published",
});

/** Sepadan dengan `export const revalidate` di setiap halaman. */
const REVALIDATE_SECONDS = 3600;

/**
 * Baca Sanity lewat ini, bukan lewat `client.fetch` langsung.
 *
 * Dengan CDN mati, setiap pembacaan menembak API utama Sanity, yang rate
 * limit-nya jauh lebih ketat. Data Cache milik Next menyerapnya: query yang
 * sama hanya diambil sekali per jam berapa pun sering ia diminta. Ini paling
 * berarti di `/berita`, yang membaca `searchParams` sehingga tidak bisa
 * di-prerender — ia dirender per request, menyeret Header dan Footer ikut
 * serta.
 */
export function sanityFetch<T>(query: string, params: QueryParams = {}) {
  return client.fetch<T>(query, params, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
}

/** Header, Footer, dan beberapa halaman sama-sama memintanya dalam render yang sama. */
export const getSiteSettings = cache(() =>
  sanityFetch<SiteSettings | null>(siteSettingsQuery),
);
