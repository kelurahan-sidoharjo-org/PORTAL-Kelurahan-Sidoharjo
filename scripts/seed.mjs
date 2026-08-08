/**
 * Script seed developer — mengisi dataset Sanity dengan konten dummy
 * (place, UMKM, staf, artikel) supaya halaman punya isi sebelum konten
 * asli ada. Tanpa foto.
 *
 * Isinya di scripts/seed-data/*.csv; file ini cuma membaca CSV dan
 * menulis ke Sanity. Di luar src/app dan tidak diimpor apa pun, jadi
 * Next tidak membundelnya — token tulis tetap cuma di terminal.
 *
 * Id pakai `seed-*` (strip, bukan titik) dan createOrReplace, jadi aman
 * dijalankan ulang dan `--delete` bisa menemukan persis yang dibuatnya.
 * Titik dihindari karena Sanity menganggapnya namespace terlarang (mis.
 * `drafts.`) dan API publik tanpa token menolak menyajikan dokumen
 * ber-titik.
 *
 * Pemakaian (dari root proyek):
 *   node scripts/seed.mjs                                  # dry run
 *   node --env-file=.env.local scripts/seed.mjs --commit   # tulis sungguhan
 *   node --env-file=.env.local scripts/seed.mjs --delete   # hapus semua seed
 *
 * --commit dan --delete butuh SANITY_WRITE_TOKEN di .env.local.
 */

import { readFileSync } from "node:fs";

const mode = process.argv.includes("--delete")
  ? "delete"
  : process.argv.includes("--commit")
    ? "commit"
    : "dry";

// --- Baca CSV -----------------------------------------------------------

/**
 * Parser CSV minimal — cukup untuk file kita sendiri, tanpa dependensi.
 * Menangani field berkutip (nilai bisa mengandung koma, mis. "Siti
 * Aminah, S.E."), `""` sebagai kutip yang di-escape, dan akhiran CRLF.
 * Mengembalikan array of objects yang key-nya dari baris header.
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
        if (text[i + 1] === '"') { field += '"'; i++; } // kutip yang di-escape
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
    .filter((r) => r.some((v) => v.trim() !== "")) // buang baris kosong
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function readCsv(name) {
  const path = new URL(`./seed-data/${name}`, import.meta.url);
  return parseCsv(readFileSync(path, "utf8"));
}

// --- helper ---------------------------------------------------------------

let keyCounter = 0;
const key = () => `k${(keyCounter++).toString(36)}`;
const pad = (n) => String(n).padStart(2, "0");

/** Membangun Portable Text body dari paragraf (CSV menyimpannya dipisah "|"). */
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

// Mencerminkan slugify() di sanity/schemaTypes/components/postDocumentInput.tsx.
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

// --- membangun dokumen dari CSV -------------------------------------

// Kedua field `location` di bawah opsional (place/umkm tanpa titik cuma
// tidak dapat pin), jadi cuma dipasang kalau sel CSV-nya terisi — pola
// "isi cuma kalau terisi" yang sama seperti `googleMapsUrl` di umkm.
function geopoint(r) {
  if (!r.lat || !r.lng) return {};
  return { location: { _type: "geopoint", lat: Number(r.lat), lng: Number(r.lng) } };
}

const places = readCsv("places.csv").map((r, i) => ({
  _id: `seed-place-${i + 1}`,
  _type: "place",
  name: r.name,
  category: r.category,
  googleMapsUrl: r.googleMapsUrl,
  ...geopoint(r),
}));

const umkm = readCsv("umkm.csv").map((r, i) => ({
  _id: `seed-umkm-${i + 1}`,
  _type: "umkm",
  businessName: r.businessName,
  description: r.description,
  contactUrl: r.contactUrl,
  // Field opsional — cuma diisi kalau sel CSV-nya terisi, supaya baris
  // kosong tetap menguji perilaku "lihat peta" yang tersembunyi saat kosong.
  ...(r.googleMapsUrl ? { googleMapsUrl: r.googleMapsUrl } : {}),
  ...geopoint(r),
}));

const staff = readCsv("staff.csv").map((r, i) => ({
  _id: `seed-staff-${i + 1}`,
  _type: "staffMember",
  name: r.name,
  position: r.position,
  order: Number(r.order),
}));

// Counter per kategori supaya id-nya jadi seed-post-berita-1, seed-post-prestasi-1, …
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
 * Pengecekan murah yang menangkap CSV yang rusak (mis. koma berkutip
 * ter-parse salah, kolom bergeser) sebelum apa pun ditulis ke Sanity.
 */
function validate() {
  // Mencerminkan PLACE_CATEGORIES di src/lib/places.ts — dijaga sebagai
  // daftar literal, bukan diimpor, karena script ini jalan sendiri dengan node polos.
  const CATEGORIES = [
    "pemerintahan", "ibadah", "sekolah", "kesehatan", "toko", "pertanian",
    "perkebunan", "kandang", "industri", "jasa", "wisata", "landmark", "lainnya",
  ];
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

// --- jalankan -------------------------------------------------------------------

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
    // Satu contoh per tipe, supaya CSV yang salah parse (koma berkutip,
    // body dipisah "|") langsung terlihat di sini sebelum apa pun ditulis.
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
    // Cocokkan id strip baru (`seed-…`) plus id titik lama
    // (`seed.…` dan versi `drafts.seed.…`-nya) supaya seed lama ikut terbersihkan.
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
