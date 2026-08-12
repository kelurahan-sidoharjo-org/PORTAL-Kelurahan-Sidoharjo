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
 * Bisa dijalankan per bagian dengan --only (berlaku untuk ketiga mode di
 * atas), supaya mengubah satu CSV tidak perlu menulis ulang semuanya:
 *   node --env-file=.env.local scripts/seed.mjs --commit --only=places
 *   node --env-file=.env.local scripts/seed.mjs --delete --only=posts,umkm
 *
 * --commit dan --delete butuh SANITY_WRITE_TOKEN di .env.local.
 */

import { readFileSync } from "node:fs";

const mode = process.argv.includes("--delete")
  ? "delete"
  : process.argv.includes("--commit")
    ? "commit"
    : "dry";

// --- Pilihan bagian (--only) ---------------------------------------------

const GROUP_NAMES = ["places", "umkm", "staff", "posts"];

/** Membaca `--only=a,b` maupun `--only a,b`; null artinya semua bagian. */
function parseOnly(argv) {
  const inline = argv.find((a) => a.startsWith("--only="));
  const at = argv.indexOf("--only");
  if (!inline && at === -1) return null;
  const raw = inline ? inline.slice("--only=".length) : argv[at + 1];
  if (!raw || raw.startsWith("--")) {
    console.error(`--only butuh nilai, mis. --only=${GROUP_NAMES[0]}`);
    process.exit(1);
  }
  const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const unknown = names.filter((n) => !GROUP_NAMES.includes(n));
  if (unknown.length) {
    console.error(
      `--only tidak mengenal: ${unknown.join(", ")}\n` +
        `Pilihan: ${GROUP_NAMES.join(", ")}`,
    );
    process.exit(1);
  }
  // De-duplikasi sambil menjaga urutan tetap seperti GROUP_NAMES, supaya
  // ringkasan yang dicetak selalu sama urutannya tak peduli urutan ketikan.
  return GROUP_NAMES.filter((n) => names.includes(n));
}

const only = parseOnly(process.argv);

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

// Satu tempat yang menghubungkan nama --only ke dokumennya dan ke _type
// Sanity-nya (yang dipakai --delete untuk mempersempit sapuannya).
const GROUPS = {
  places: { docs: places, type: "place" },
  umkm: { docs: umkm, type: "umkm" },
  staff: { docs: staff, type: "staffMember" },
  posts: { docs: posts, type: "post" },
};

const selectedNames = only ?? GROUP_NAMES;
const docs = selectedNames.flatMap((n) => GROUPS[n].docs);
const selectedTypes = selectedNames.map((n) => GROUPS[n].type);
const scope = only ? ` (${selectedNames.join(", ")})` : "";

/**
 * Pengecekan murah yang menangkap CSV yang rusak (mis. koma berkutip
 * ter-parse salah, kolom bergeser) sebelum apa pun ditulis ke Sanity.
 * Jalan atas `docs`, jadi ikut mengecil kalau --only dipakai — CSV yang
 * rusak di bagian yang tidak dipilih tidak memblokir seed bagian lain.
 */
function validate() {
  // Mencerminkan PLACE_CATEGORIES di src/lib/places.ts — dijaga sebagai
  // daftar literal, bukan diimpor, karena script ini jalan sendiri dengan node polos.
  const CATEGORIES = [
    "pemerintahan", "ibadah", "sekolah", "kesehatan", "toko", "pertanian",
    "perkebunan", "kandang", "industri", "jasa", "wisata", "landmark", "lainnya",
  ];
  const problems = [];
  for (const doc of docs) {
    switch (doc._type) {
      case "place":
        if (!CATEGORIES.includes(doc.category))
          problems.push(`${doc._id}: bad category "${doc.category}"`);
        if (!doc.name || !doc.googleMapsUrl)
          problems.push(`${doc._id}: missing name/map`);
        break;
      case "staffMember":
        if (!Number.isFinite(doc.order))
          problems.push(`${doc._id}: order is not a number ("${doc.order}")`);
        if (!doc.name || !doc.position)
          problems.push(`${doc._id}: missing name/position`);
        break;
      case "umkm":
        if (!doc.businessName || !doc.contactUrl)
          problems.push(`${doc._id}: missing name/contact`);
        break;
      case "post":
        if (!doc.title || !doc.body.length)
          problems.push(`${doc._id}: missing title/body`);
        break;
    }
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

  const onlyFlag = only ? ` --only=${selectedNames.join(",")}` : "";

  if (mode === "dry") {
    console.log(`DRY RUN${scope} — nothing will be written.\n`);
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
        `  node --env-file=.env.local scripts/seed.mjs --commit${onlyFlag}`,
    );
    return;
  }

  const client = await makeClient();

  if (mode === "delete") {
    // Cocokkan id strip baru (`seed-…`) plus id titik lama
    // (`seed.…` dan versi `drafts.seed.…`-nya) supaya seed lama ikut terbersihkan.
    // Batasnya lewat _type, bukan prefix id, karena id seed lama tidak selalu
    // memuat nama tipenya — jadi --only tetap tepat sasaran untuk seed lama.
    const ids = await client.fetch(
      '*[_type in $types && (string::startsWith(_id, "seed-") ||' +
        ' string::startsWith(_id, "seed.") ||' +
        ' string::startsWith(_id, "drafts.seed."))]._id',
      { types: selectedTypes },
    );
    if (ids.length === 0) {
      console.log(`No seeded documents found${scope}.`);
      return;
    }
    const tx = ids.reduce((t, id) => t.delete(id), client.transaction());
    await tx.commit();
    console.log(`Deleted ${ids.length} seeded documents${scope}.`);
    return;
  }

  // commit
  const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
  await tx.commit();
  console.log(`Wrote ${docs.length} documents${scope}.`);
  summarize();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
