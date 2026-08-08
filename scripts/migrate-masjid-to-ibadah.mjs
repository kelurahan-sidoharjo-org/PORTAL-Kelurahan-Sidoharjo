/**
 * Migrasi sekali jalan: `place.category` "masjid" → "ibadah".
 *
 * Rebuild /peta memperluas kategori itu supaya juga menampung gereja,
 * kelenteng, atau vihara — place lama masih membawa string "masjid", yang
 * begitu dibuang dari enum jadi nilai tidak valid dan diam-diam
 * kehilangan pin.
 *
 * Menambal dokumen terbit MAUPUN draft-nya — kalau cuma yang terbit,
 * draft dengan nilai lama akan menimpanya lagi di Publish berikutnya.
 *
 * Pemakaian (dari root proyek):
 *   node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs            # dry run
 *   node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs --commit   # terapkan
 *
 * Butuh SANITY_WRITE_TOKEN di .env.local, sama seperti scripts/seed.mjs.
 */

const commit = process.argv.includes("--commit");

async function main() {
  const { createClient } = await import("@sanity/client");
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    console.error(
      "\nSANITY_WRITE_TOKEN is missing. Add an Editor token to .env.local and\n" +
        "run with:  node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs --commit\n",
    );
    process.exit(1);
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
  });

  // `drafts.**` cocok dengan draft, baik punya pasangan terbit atau tidak
  // — perspective: "raw" supaya query melihat keduanya alih-alih Sanity meleburnya jadi satu.
  const docs = await client.fetch(
    '*[_type == "place" && category == "masjid"]{ _id }',
    {},
    { perspective: "raw" },
  );

  if (docs.length === 0) {
    console.log("No place documents with category \"masjid\" found. Nothing to do.");
    return;
  }

  console.log(`Found ${docs.length} document(s) with category "masjid":`);
  for (const { _id } of docs) console.log(`  ${_id}`);

  if (!commit) {
    console.log(
      "\nDRY RUN — nothing was written.\n" +
        "To apply, run:\n" +
        "  node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs --commit",
    );
    return;
  }

  const tx = docs.reduce(
    (t, { _id }) => t.patch(_id, { set: { category: "ibadah" } }),
    client.transaction(),
  );
  await tx.commit();
  console.log(`\nUpdated ${docs.length} document(s) to category "ibadah".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
