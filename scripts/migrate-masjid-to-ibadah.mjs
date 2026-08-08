/**
 * One-time migration: `place.category` value "masjid" → "ibadah".
 *
 * The /peta rebuild widened that category so it can also hold a church,
 * temple, or vihara — but any place published before this migration still
 * carries the old string, and the moment the schema's enum drops "masjid" it
 * becomes an invalid value in Studio and the place quietly loses its pin.
 *
 * Patches BOTH the published document and its draft (`drafts.<id>`) if one
 * exists — a place mid-edit has two copies, and fixing only the published one
 * would leave the draft holding the stale value, ready to overwrite the fix on
 * the next Publish.
 *
 * Usage (from the project root):
 *   node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs            # dry run
 *   node --env-file=.env.local scripts/migrate-masjid-to-ibadah.mjs --commit   # apply
 *
 * Needs SANITY_WRITE_TOKEN in .env.local, same token as scripts/seed.mjs.
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

  // `drafts.**` matches a draft whether or not it also has a published
  // counterpart — perspective: "raw" so the query sees both instead of Sanity
  // collapsing them to one.
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
