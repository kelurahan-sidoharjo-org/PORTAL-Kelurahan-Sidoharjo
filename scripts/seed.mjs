/**
 * Developer seed script — fills the Sanity dataset with realistic dummy content
 * (places, UMKM, staff, and berita/prestasi articles) so the pages have
 * something to show before real content exists. No photos.
 *
 * The content lives in scripts/seed-data/*.csv (edit those to change what gets
 * seeded); this file is just the logic that reads them and writes to Sanity.
 * Kept in the repo as a utility (handy for a fresh clone or a new dataset). It
 * lives outside src/app and is imported by nothing, so Next never bundles it —
 * the write token stays terminal-only.
 *
 * Every document uses a `seed-*` id (hyphens, NOT dots) and is written with
 * createOrReplace, so:
 *   - re-running is safe (it overwrites, never duplicates), and
 *   - `--delete` can find and remove exactly what this script created.
 *
 * Why hyphens and not dots: Sanity treats a `.` in a document id as a reserved
 * namespace (e.g. `drafts.`), and the PUBLIC (tokenless) API refuses to serve
 * any document whose id contains a dot — it's considered private/system. An
 * earlier version used `seed.place.1` etc.; those documents existed and were
 * readable WITH a token, but the live website (which reads without a token)
 * never saw them. Dotless ids like `seed-place-1` are ordinary public docs.
 *
 * Usage (from the project root):
 *   node scripts/seed.mjs                                  # dry run: prints, writes nothing
 *   node --env-file=.env.local scripts/seed.mjs --commit   # actually inserts
 *   node --env-file=.env.local scripts/seed.mjs --delete   # removes all seeded docs
 *
 * --commit and --delete need SANITY_WRITE_TOKEN in .env.local (an Editor token
 * from sanity.io/manage → API → Tokens). The dry run needs nothing.
 */

import { readFileSync } from "node:fs";

const mode = process.argv.includes("--delete")
  ? "delete"
  : process.argv.includes("--commit")
    ? "commit"
    : "dry";

// --- CSV reading -----------------------------------------------------------

/**
 * Minimal CSV parser — enough for our own well-formed files, with no
 * dependency. Handles quoted fields (so a value can contain commas, e.g.
 * "Siti Aminah, S.E."), doubled "" as an escaped quote, and CRLF endings.
 * Returns an array of objects keyed by the header row.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else quoted = false;
      } else field += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }

  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((v) => v.trim() !== "")) // drop blank lines
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function readCsv(name) {
  const path = new URL(`./seed-data/${name}`, import.meta.url);
  return parseCsv(readFileSync(path, "utf8"));
}

// --- helpers ---------------------------------------------------------------

let keyCounter = 0;
const key = () => `k${(keyCounter++).toString(36)}`;
const pad = (n) => String(n).padStart(2, "0");

/** Builds a Portable Text body from paragraphs (CSV stores them "|"-separated). */
function body(text) {
  return text
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: key(), text: paragraph, marks: [] }],
    }));
}

// Mirrors slugify() in sanity/schemaTypes/components/postDocumentInput.tsx.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// --- build the documents from the CSVs -------------------------------------

const places = readCsv("places.csv").map((r, i) => ({
  _id: `seed-place-${i + 1}`,
  _type: "place",
  name: r.name,
  category: r.category,
  googleMapsUrl: r.googleMapsUrl,
}));

const umkm = readCsv("umkm.csv").map((r, i) => ({
  _id: `seed-umkm-${i + 1}`,
  _type: "umkm",
  businessName: r.businessName,
  description: r.description,
  contactUrl: r.contactUrl,
  // Optional field — only set it when the CSV cell is filled, so the empty
  // rows exercise the "lihat peta" button's hide-when-absent behaviour.
  ...(r.googleMapsUrl ? { googleMapsUrl: r.googleMapsUrl } : {}),
}));

const staff = readCsv("staff.csv").map((r, i) => ({
  _id: `seed-staff-${i + 1}`,
  _type: "staffMember",
  name: r.name,
  position: r.position,
  order: Number(r.order),
}));

// Per-category counter so ids read seed-post-berita-1, seed-post-prestasi-1, …
const postCounts = {};
const posts = readCsv("posts.csv").map((r) => {
  const n = (postCounts[r.category] = (postCounts[r.category] ?? 0) + 1);
  const [y, m, d] = r.publishedAt.split("-").map(Number);
  return {
    _id: `seed-post-${r.category}-${n}`,
    _type: "post",
    title: r.title,
    category: r.category,
    slug: {
      _type: "slug",
      current: `${slugify(r.title)}-${y}-${pad(m)}-${pad(d)}`,
    },
    publishedAt: new Date(Date.UTC(y, m - 1, d, 9, 0, 0)).toISOString(),
    excerpt: r.excerpt,
    body: body(r.body),
  };
});

const docs = [...places, ...umkm, ...staff, ...posts];

/**
 * Cheap sanity checks that catch a mangled CSV (e.g. a quoted comma parsed
 * wrong, shifting columns) before anything is written to Sanity.
 */
function validate() {
  const CATEGORIES = ["sekolah", "masjid", "pemerintahan", "toko", "lainnya"];
  const problems = [];
  for (const p of places) {
    if (!CATEGORIES.includes(p.category))
      problems.push(`${p._id}: bad category "${p.category}"`);
    if (!p.name || !p.googleMapsUrl) problems.push(`${p._id}: missing name/map`);
  }
  for (const s of staff) {
    if (!Number.isFinite(s.order))
      problems.push(`${s._id}: order is not a number ("${s.order}")`);
    if (!s.name || !s.position) problems.push(`${s._id}: missing name/position`);
  }
  for (const u of umkm) {
    if (!u.businessName || !u.contactUrl)
      problems.push(`${u._id}: missing name/contact`);
  }
  for (const post of posts) {
    if (!post.title || !post.body.length)
      problems.push(`${post._id}: missing title/body`);
  }
  if (problems.length) {
    console.error("CSV validation failed:\n  " + problems.join("\n  "));
    process.exit(1);
  }
}

// --- run -------------------------------------------------------------------

function summarize() {
  const counts = docs.reduce((acc, d) => {
    acc[d._type] = (acc[d._type] || 0) + 1;
    return acc;
  }, {});
  console.log("Documents by type:");
  for (const [type, n] of Object.entries(counts)) console.log(`  ${type}: ${n}`);
  console.log(`  total: ${docs.length}`);
}

async function makeClient() {
  const { createClient } = await import("@sanity/client");
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    console.error(
      "\nSANITY_WRITE_TOKEN is missing. Add an Editor token to .env.local and\n" +
        "run with:  node --env-file=.env.local scripts/seed.mjs --commit\n",
    );
    process.exit(1);
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
  });
}

async function main() {
  validate();

  if (mode === "dry") {
    console.log("DRY RUN — nothing will be written.\n");
    summarize();
    // One sample per type, so a bad CSV parse (quoted commas, |-split bodies)
    // is visible here before anything is written.
    const seen = new Set();
    console.log("\nSample of each type:");
    for (const doc of docs) {
      if (seen.has(doc._type)) continue;
      seen.add(doc._type);
      console.log(`\n${JSON.stringify(doc, null, 2)}`);
    }
    console.log(
      "\nTo write these, run:\n" +
        "  node --env-file=.env.local scripts/seed.mjs --commit",
    );
    return;
  }

  const client = await makeClient();

  if (mode === "delete") {
    // Match new hyphen ids (`seed-…`) plus any legacy dotted ones
    // (`seed.…` and their `drafts.seed.…` versions) so old seeds get cleaned up.
    const ids = await client.fetch(
      '*[string::startsWith(_id, "seed-") || string::startsWith(_id, "seed.") || string::startsWith(_id, "drafts.seed.")]._id',
    );
    if (ids.length === 0) {
      console.log("No seeded documents found.");
      return;
    }
    const tx = ids.reduce((t, id) => t.delete(id), client.transaction());
    await tx.commit();
    console.log(`Deleted ${ids.length} seeded documents.`);
    return;
  }

  // commit
  const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
  await tx.commit();
  console.log(`Wrote ${docs.length} documents.`);
  summarize();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
