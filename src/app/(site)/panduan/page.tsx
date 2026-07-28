import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { Markdown } from "@/components/panduan/Markdown";
import { siteUrl } from "@/lib/site";

/**
 * The staff guide, served from the same Markdown file the repo keeps at
 * docs/panduan-staf.md.
 *
 * It exists as a page because kelurahan staff have no realistic way to read a
 * file in a GitHub repo, and the guide is worthless if they can't reach it. One
 * source of truth: edit the Markdown, the page follows.
 *
 * Public but unlisted — no login, so staff can open it on their own phones, yet
 * `noindex` and absent from sitemap.ts because it's internal operating
 * instructions ("don't delete the dataset"), not content for warga.
 */

// Prerendered at build, so the file is read once during `next build` and baked
// into static HTML — no filesystem access at request time on Vercel. If the
// Markdown is ever moved or renamed the build fails loudly, which beats a page
// that silently 500s in production.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Panduan Staf",
  description:
    "Panduan penggunaan Ruang Kerja (Studio) untuk perangkat Kelurahan Sidoharjo.",
  robots: { index: false, follow: false },
};

/**
 * The guide quotes the site's own address a few times — most importantly the
 * `/admin` link staff bookmark. Hardcoding it would make the guide wrong the
 * day the .go.id domain lands, in a document nobody would think to revisit.
 * Substituting from `siteUrl` means it says vercel.app today and the real
 * domain after the cutover, with no edit.
 *
 * An explicit token rather than a natural-looking placeholder: if someone
 * rewrites the surrounding sentence, `{{SITE_URL}}` still stands out as
 * something that must survive, and a missed one is obvious on the page rather
 * than quietly showing a fake address.
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
