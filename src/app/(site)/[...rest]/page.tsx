import { notFound } from "next/navigation";

/**
 * Menarik alamat yang tidak cocok ke grup (site) supaya dapat 404
 * bergaya di not-found.tsx, bukan 404 polos bawaan Next.
 *
 * Dibutuhkan karena tidak ada root layout di src/app/ — (site) dan admin
 * terpisah, jadi URL yang tidak cocok tidak pernah sampai not-found.tsx sendiri.
 *
 * Prioritas routing paling rendah — tiap route sungguhan tetap menang lebih dulu.
 */
export default function CatchAll() {
  notFound();
}
