import { notFound } from "next/navigation";

/**
 * Pulls unmatched addresses into the (site) group so they get the styled 404
 * in not-found.tsx instead of Next's bare black-and-white one.
 *
 * Needed because there is no root layout at src/app/ — (site) and admin are
 * separate root layouts, so an unmatched URL belongs to no group and never
 * reaches a not-found.tsx on its own.
 *
 * Lowest routing priority, so every real route still wins: /berita/[slug],
 * /admin/[[...tool]], /api/revalidate, and the metadata files all match first.
 */
export default function CatchAll() {
  notFound();
}
