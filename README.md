# Portal Kelurahan Sidoharjo

Government website for Kelurahan Sidoharjo. See [CLAUDE.md](./CLAUDE.md) for
the full architecture, content model, and build roadmap.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.local.example`
to `.env.local` first — the app throws a named error on startup if the Sanity
project id is missing.

## Documentation

- **[docs/panduan-staf.md](./docs/panduan-staf.md)** — staff guide, in Bahasa
  Indonesia. How to log in, publish a berita, upload photos. **Also served at
  `/panduan`** (rendered from this exact file, linked in the footer, `noindex`
  and kept out of the sitemap) — that URL is what you give kelurahan staff, not
  this one.
- **[docs/handover.md](./docs/handover.md)** — the transfer runbook, and an
  honest statement of what the kelurahan can and can't do without a developer.
- **[docs/domain-go-id.md](./docs/domain-go-id.md)** — questions to put to PANDI
  / Dinas Kominfo before registering the domain.
- **[CLAUDE.md](./CLAUDE.md)** — architecture, content model, and the reasoning
  behind each decision. Start here if you're picking this project up.

## Deployment

Next.js on Vercel Hobby, content from Sanity. Pages are ISR: built once, cached
at the edge, refreshed on a 1-hour timer *or* immediately via the webhook below.

### Environment variables

| Variable | Vercel? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Which Sanity project to read. Public — it ships in the browser bundle by design. |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | `production`. Defaults to that if unset. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Absolute site URL, no trailing slash. Feeds metadata, link previews, `sitemap.xml`, `robots.txt`. Falls back to Vercel's own production URL, so it's optional until the real domain lands — then it's the *only* code-side change the cutover needs. See `src/lib/site.ts`. |
| `SANITY_API_VERSION` | Optional | Pinned API date. Must match `sanity.config.ts`. |
| `SANITY_REVALIDATE_SECRET` | Yes | Shared secret for the webhook below. |
| `SANITY_WRITE_TOKEN` | **Never** | Local only, for `scripts/seed.mjs`. The deployed site is read-only and has no use for a write key. |

**Vercel reads environment variables at build time.** Adding or changing one
does nothing to the running site until you redeploy.

### On-demand revalidation webhook

Without this, a published post takes up to an hour to appear. Configure in
sanity.io/manage → API → Webhooks:

| Setting | Value |
| --- | --- |
| URL | `https://<site>/api/revalidate` |
| Method | POST |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["post","siteSettings","staffMember","umkm","place"]` |
| Projection | `{_type, slug}` |
| HTTP header | `x-revalidate-secret` = the value of `SANITY_REVALIDATE_SECRET` |

The route compares that header to the environment variable with an exact string
match, so **the value must carry no surrounding quotes** and must be identical
in both places. A mismatch returns 401 and fails silently — the site simply
keeps serving stale pages. Check Sanity's delivery log for a `200` with
`{ revalidated: true }`.

### CORS

Studio is embedded at `/admin`, so there is nothing to register with Sanity —
only the browser origin to allowlist:

```bash
npx sanity cors add https://<site> --credentials   # npx sanity cors list
```

`--credentials` is required: Studio sends a login session, not just public
reads. Without it `/admin` shows the "Connect this Studio" wall. Origins are
stored on the Sanity project, **not in version control**, so a fresh clone or a
new domain needs this again.

## Image storage budget

**The one metered resource that grows over time.** Sanity's free tier allows
**5 GB of assets**, and Sanity always keeps the *original* upload — serving a
resized copy does not shrink what's stored. Nothing else in this project
accumulates: the site is static, there's no database, and traffic is free.

### The trade that was made

Studio ships a custom asset source (`sanity/assetSources/`) that downscales
images to ~1600px **in the browser, before upload**. It is reachable via the
**Select** button on any image field.

It is *not* the only upload path. Drag-and-drop is deliberately left enabled
(`directUploads: true` in `sanity.config.ts`). Disabling it did guarantee every
photo was shrunk, but it made Sanity render a greyed-out upload row reading
**"Can't upload files here"** — which non-technical staff reasonably read as a
broken field. Usability was chosen over the guarantee; image field descriptions
now recommend Select instead of forcing it.

**The cost of that choice is time.** Rough figures — a raw phone photo is
~4 MB, a resized one ~300 KB, and a berita post carries about 9 images
(1 cover + ~8 in the Dokumentasi gallery):

| Posting rate | If staff drag-and-drop raw photos | If staff use Select |
| --- | --- | --- |
| 1 post / month | ~12 years | beyond any planning horizon |
| 2 posts / month | ~6 years | ~80 years |
| 1 post / week | ~3 years | ~35 years |

The Dokumentasi gallery dominates this. A post with 2 photos instead of 8
roughly triples every figure in the left column.

### What a future developer should do

The realistic failure mode is uploads silently starting to fail some years
after handover, once nobody is maintaining the site. If you are picking this
project up:

1. **Check actual usage first** — sanity.io/manage → project → Usage. Do not
   act on the estimates above; they assume a posting rate nobody has verified.
2. **If storage is climbing faster than expected**, the cheapest fix is to set
   `directUploads: false` in `sanity.config.ts`, which forces every upload back
   through the resize source. Expect the confusing "Can't upload files here"
   message to return — pair it with a note in the staff guide.
3. **If the quota is already close**, old originals can be replaced with
   resized versions; the raw file is what's being stored, not what's served.
4. Only then consider a paid tier. It contradicts the Rp 0 goal, and the
   kelurahan may have no budget process for a recurring foreign card charge.
