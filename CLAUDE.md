# Portal Kelurahan Sidoharjo

Public website for Kelurahan Sidoharjo, Kecamatan Sidoharjo, Kabupaten Wonogiri.
Berita, prestasi, an interactive map of public places and UMKM, the kelurahan
office and its staff — all edited by non-technical staff through an embedded
Sanity Studio at `/admin`. Built to be **handed over and left running**: Rp 0 to
operate, and documented so any developer can pick it up, not just the one who
wrote it.

## Rules for the assistant

- **NO COMMITTING.** Never run `git commit`/`git push` unless asked in that
  exact message. Leave changes for review.
- **NO BUILDING.** Never run `npm run build` unless asked (~60s; the user runs
  it). `npm run lint` and `npm test` are cheap and fine to run.
- **READ BOTH MOCKUPS BEFORE BUILDING OR REVISING A PAGE.**
  `design-reference/<page>-desktop.png` **and** `<page>-mobile.png`. Mobile is a
  different layout, not the desktop narrowed — on `beranda` it changes Layanan
  to 3 columns, left-aligns centred headings, and makes Berita a swipe carousel.
  None of that is inferable from the desktop frame.

## Stack

Next.js (App Router) + Tailwind → Vercel Hobby. Sanity.io + Studio embedded at
`/admin` (Indonesian field labels; editors are non-technical). Leaflet +
react-leaflet for the `/peta` map. Montserrat (headings) / Poppins (body).

**shadcn/ui is not really in the stack.** `globals.css` imports
`shadcn/tailwind.css` for its base tokens, but the one generated component
(`ui/button.tsx`) was never imported by anything and has been deleted. Don't
reach for `npx shadcn add` — every component here is hand-written.

**Recharts is Phase 6 and not installed yet** — `/demografi` isn't built.

No database, no forms, no server-side writes — read-only static/ISR. No public
accounts, no login on the public site.

### Local dev

- **`npm run build` takes ~60s**, ~40s of it bundling Studio (one 4 MB chunk).
  Fixed cost, not proportional to page count. Build at phase boundaries.
- **`vitest.config.ts` needs something to teach Vite the `@/` alias** — Vitest
  doesn't pick it up from `tsconfig.json`. Verified 2026-07-26 on Vite 8.1.5:
  `resolve: { tsconfigPaths: true }` is native and works. **Before Vite 8 that
  option didn't exist** and Vite ignores unknown keys silently, which is why the
  old note claimed it was never real. Downgrading Vite means restoring
  `vite-tsconfig-paths`.
  - **Removing it fails exactly one test file**, so breakage reads as flaky
    rather than as config. Only `utils.test.ts` imports a *value* through `@/`;
    `places.test.ts` uses it for `import type` only, which is erased before
    runtime. A mostly-green run doesn't prove the alias works.

### Sanity project (settings live outside this repo)

Credentials in `.env.local` (gitignored; see `.env.local.example`).

**CORS origins live on the Sanity project, not in version control** — a fresh
clone hits a "Connect this Studio" wall at `/admin` until allowlisted.
`--credentials` is required (Studio sends a login session, not just public
reads):

```bash
npx sanity cors add http://localhost:3000 --credentials   # npx sanity cors list
```

`localhost:3000` and the Vercel production origin are added. Add the `.go.id`
origin at Phase 5, once the domain exists — a guessed hostname leaves a stale
entry nobody can later distinguish from a real one.

## Content model — `sanity/schemaTypes/*`, aggregated in `index.ts`

- **`siteSettings`** (singleton): `villageName`, `heroVideoUrl`, `contactEmail`,
  `contactWhatsapp`, `googleMapsUrl`, `instagramUrl`, `tiktokUrl`,
  `orgChartImage`, `officeImage` (`/pemerintah-kelurahan` hero). No
  `contactAddress` — dropped on purpose. No `kelurahanMapImage` either — `/peta`
  is a real interactive map now (see Phase 3), so the uploaded picture had no
  effect on anything and was dropped for the same reason `logo` was.
- **`post`** — Berita + Prestasi merged; `/berita` and `/prestasi` filter on
  `category`: `title`, `slug`, `category` (`berita`|`prestasi`), `publishedAt`,
  `coverImage`, `images` (→ "Dokumentasi"), `excerpt`, `body`.
  - `slug` and `category` are auto-set and **hidden** — staff never see them.
  - `publishedAt` is **prefilled with today but visible and editable**, so old
    announcements can be backdated. Hiding it would make that impossible.
    **Required** since the Batch A audit fix — an empty value used to print
    "Invalid Date" on cards and silently drop the article from `/prestasi`'s
    `groupByYear`.
  - `previousSlugs` (hidden, array of string) — every address the article used
    to have. Editing the title moves the slug (it's derived from the title +
    publish date), and this is what keeps the old URL alive instead of 404ing
    a link already shared on WhatsApp or indexed by Google. Written by
    `PostDocumentInput` via `nextSlugState()`
    (`sanity/schemaTypes/components/slugHistory.ts`), which distinguishes a
    real published address from the throwaway intermediate slugs produced
    while someone is still typing a new title. See the `/berita/[slug]`
    redirect below.
- **`place`**: `name`, `category` (13 values — `pemerintahan`, `ibadah`,
  `sekolah`, `kesehatan`, `toko`, `pertanian`, `perkebunan`, `kandang`,
  `industri`, `jasa`, `wisata`, `landmark`, `lainnya` — drives the map pin's
  emoji/colour AND the legend, see Phase 3), `googleMapsUrl`, `location`
  (`geopoint`, optional — no point means no pin, not an error).
- **`staffMember`**: `name`, `position`, `photo`, `order`.
- **`umkm`**: `businessName`, `description`, `photo`, `contactUrl`,
  `googleMapsUrl` (optional — "lihat peta" on `/umkm` renders only when
  filled), `location` (`geopoint`, optional — a business with a point also
  gets a pin on `/peta`; see Phase 3 for why it isn't a `place.category`
  instead).
- **`blockContent`**: portable text for `post.body`.

## Images

**Sanity CDN** for anything staff edit (`src/lib/sanity/image.ts`);
**`public/images/`** for fixed Figma assets.

- **Display:** Sanity CDN transform URLs (`?w=…&auto=format`), NOT Vercel's
  optimizer (Hobby quota). `next.config.ts` sets a custom `loader`
  (`src/lib/sanity/imageLoader.ts`), which bypasses `/_next/image` entirely — so
  Next never fetches remote images and **no `remotePatterns` entry is needed**.
- **Storage (5 GB, the only metered resource that grows):** Sanity keeps the
  **raw original**; `auto=format` changes what's *sent*, not what's stored.
  Client-side downscale to ~1600px is wired behind Studio's **Select** button,
  but `directUploads` is **on**, so drag-and-drop still accepts raw photos.
  Forcing the resize made Sanity render a greyed-out "Can't upload files here",
  which staff read as a broken field; usability won. Field descriptions
  recommend Select (`schemaTypes/uploadHint.ts`). **Cost is time, not
  correctness — see the storage budget table in `README.md`.**
- Rule: **web-sized originals in, WebP variants out.**

### `public/images/` — exported from Figma

Figma MCP is quota-exhausted, so exports are manual. **All assets are exported
and correctly named — the list is complete.**

Naming: `ic-<name>.png`, kebab-case.

- Header: `ic-instagram`, `ic-tiktok`
- `/pemerintah-kelurahan` contact lines: `ic-whatsapp`, `ic-gmail`. The Footer
  keeps the inline-SVG `WhatsAppIcon` instead — it tints with `currentColor` for
  hover, which a PNG can't.
- Homepage Layanan: `ic-kantor-kelurahan`, `ic-peta`, `ic-umkm`, `ic-prestasi`
- `/prestasi`: `ic-trophy`

**No `ic-place-*` files** — `/peta`'s map pins are emoji (`PLACE_CATEGORY_MARKERS`
in `src/lib/places.ts`), not PNGs, so those five files were deleted along with
the card list they used to serve. See Phase 3.

**Two trophies, easy to confuse:** `ic-prestasi` is gold/glossy, homepage
Layanan only. `ic-trophy` is a white glyph on dark green, used on `/prestasi` as
both the timeline year marker and the stand-in for cards with no `coverImage`.
Figma uses a third (indigo on lavender) for that stand-in — **deliberately
dropped. Don't "fix" it.**

The 4 Layanan icons are bespoke assets, not emoji — they merely *read* like
🏛 🗺 🏪 🏆. Use the files.

**The header logo is static**: `logo-kelurahan.png` (Wonogiri regency seal), a
fixed government emblem. `siteSettings.logo` was dropped rather than left as a
control that does nothing — an unused Studio field misleads staff after
handover. Same file serves as `src/app/icon.png` (favicon).

**Generic UI icons → `lucide-react`**: arrows, calendar, map pin, search.

**Page background is CSS, not the 227 KB PNG** in `design-reference/` — it's
just a vertical gradient: `bg-gradient-to-b from-page-top from-25% to-page-bottom`.

## Routes

`/` `/berita` `/berita/[slug]` `/peta` `/pemerintah-kelurahan` `/umkm`
`/prestasi` `/panduan` `/demografi` (Phase 6) `/admin` `/api/revalidate`,
plus `sitemap.ts` / `robots.ts` / `(site)/opengraph-image.tsx`.

All content pages ISR — readers hit Vercel's edge cache; Sanity is queried at
build/revalidation only, so load scales with content changes, not traffic.

- **`/berita/[slug]` is the shared article route** — it serves Prestasi posts
  too, since `PrestasiCard` links into it. Never filter that query or
  `generateStaticParams` by `category`; doing so 404s every Prestasi article.
  It also matches `previousSlugs`, then `permanentRedirect`s to the current
  slug when the requested one is stale — see `previousSlugs` above.
  `allPostSlugsQuery`/`sitemapPostsQuery` deliberately return only the
  canonical slug: old addresses are served on demand, never prerendered or
  listed in the sitemap.
- **`/berita` is paginated** via GROQ slice (`[$start...$end]`). Never render
  all posts.
  - **Search (`?q=`) therefore runs in GROQ, not in the browser** — the opposite
    of `/peta`, where `PetaMap` holds every place and UMKM at once and filters
    in memory. Copying that here would search only the twelve posts on screen
    and answer "tidak ada" for everything older, looking correct while lying.
    `toMatchPattern` (`src/lib/search.ts`) turns
    typed text into a `match` pattern; `null` means no filter, which
    `!defined($q)` short-circuits away, so one query serves both cases. The
    list and count queries **must** share that filter or the pager offers pages
    that don't exist. `BeritaSearch` is a client component only to debounce
    typing — the URL stays the source of truth, so results are shareable and
    survive a reload.
- **`/panduan` renders `docs/panduan-staf.md`** (read at build via
  `force-static`, so no filesystem access at request time; a missing file fails
  the build loudly). One source of truth — edit the Markdown, the page follows.
  **Public but unlisted:** no login, so staff can open it on their phones, but
  `noindex` and deliberately absent from `sitemap.ts` — it's internal operating
  instructions, not content for warga. **Don't add a `Disallow` for it to
  `robots.ts`**: that would stop crawlers reading the page and therefore seeing
  the `noindex`, which can leave a bare URL listed anyway. The meta tag is the
  right tool. Linked discreetly from the Footer.
- **On-demand revalidation** (`src/app/api/revalidate/route.ts`): POST, auth via
  an `x-revalidate-secret` header matching `SANITY_REVALIDATE_SECRET`, maps
  `_type` → paths. Webhook settings are documented in `README.md`. Sanity can't
  reach `localhost`, so it only works against a deployed URL. Two silent
  failure modes, both hit once — see Phase 4 below.

## Conventions

- `src/lib/sanity/{client,queries,image,imageLoader,env}.ts` — query/client/
  image layer.
- `src/lib/site.ts` — site URL, name, description. Single source for
  `metadataBase`, Open Graph, `sitemap.ts`, `robots.ts`. **Server-only.**
- `src/components/{layout,home,berita,peta,pemerintah,umkm,prestasi,demografi}/*`
- `src/app/(site)/` is the public route group; `/admin` has its own layout so
  Studio doesn't inherit site fonts/chrome. **They are separate root layouts —
  there is no layout at `src/app/`.**
- `docs/` — `panduan-staf.md` (staff guide), `handover.md` (transfer runbook),
  `domain-go-id.md` (PANDI question list). **All three are in Bahasa
  Indonesia**; every one of them is read or acted on by the kelurahan, not only
  by a developer. **`README.md` was translated to Bahasa Indonesia in place on
  2026-08-04** (at the maintainer's request) — `CLAUDE.md` is now the only
  developer-facing doc left in English, kept that way as the deep
  architecture/decision reference for whichever developer picks this project
  up next. Work from these, don't duplicate them — a translated copy alongside
  an original would drift, and nobody maintains either after handover.
- `design-reference/` — design screenshots (gitignored).

## Roadmap & progress

A phase is done only when `npm run build`, `npm run lint`, and `npm test` pass
clean.

- [X] **Phase 0 — Skeleton.** Scaffold, Vercel linked and auto-deploying.
- [X] **Phase 1 — Sanity schema + Studio.** All types; Studio at `/admin`;
  auto-resize-on-upload; Vitest + RTL.
  - `slug` is `hidden` and derived by a **document-level** input
    (`PostDocumentInput`) — a field-level input can't work, since `hidden`
    unmounts the field and stops the sync. It also seeds `excerpt` from the
    first line of `body`: a *default*, not a lock, backing off once the editor
    writes their own.
  - **Both auto-patch effects must bail when `props.readOnly` is set.** A
    read-only form (Published perspective, an old revision, a release) rejects
    every patch, so an unguarded `onChange` throws "Attempted to patch a
    read-only document" and crashes the form. Only surfaces on posts having both
    a published and a draft version.
- [X] **Phase 2 — Pages wired to Sanity.** Homepage is only: Layanan row of 4
  static nav icons → "Berita Kelurahan" (3 latest + "lihat semua", the only
  fetched content) → "Video Profil" (`heroVideoUrl`).
- [X] **Phase 3 — Peta.** Rebuilt from a static image + card list into a real
  interactive map: `PetaMap`/`PetaMapCanvas` (`src/components/peta/`), Leaflet +
  react-leaflet, Esri World Imagery satellite tiles, one pin per `place`/`umkm`
  with a `location`, name on hover, click opens `googleMapsUrl` in a new tab.
  `presentCategories`/`filterPins`/`categoryLabel`/`toMapPins`/`boundsOf` are
  pure helpers in `src/lib/places.ts` (unit-tested); the components only do
  state + render.
  - **Leaflet, not the Google Maps JS API.** The obvious read of "use Google
    Maps" turns out to conflict with the handover rules below it: Google Maps
    — even on its free tier — requires a Google Cloud project with **billing
    enabled** just to mint an API key, and that billing account would become
    one more thing to transfer to the kelurahan (or worse, stay on the
    developer's card). Leaflet needs no key, no account, and no billing at
    all — Esri's tiles and Nominatim's search (used by the Studio input below)
    are both free and anonymous. Zero handover cost, permanently.
  - **Cards are gone entirely** — the map *is* the page now, not a companion to
    a list. What a card used to show (name, category, a link out to Google
    Maps) is now on the pin itself: hover for the tooltip, click for the link.
    A `sr-only` list of every pin's name + Maps link sits below the map so
    screen-reader and keyboard-only visitors aren't left with nothing — Leaflet
    markers are Tab-reachable too, but give no sense of the full list.
  - **Legend, not filter pills.** Clicking a legend row toggles that category's
    pins on/off (multiple can be off at once) rather than picking one active
    category — closer to what a map with a dozen-plus categories needs than the
    old single-select pills were.
  - **`location` is a `geopoint`, optional on both `place` and `umkm`.** A
    document with no point simply gets no pin — not an error, not hidden from
    Studio, just invisible on `/peta` until someone fills it in. `place`'s
    Studio preview flags this in the subtitle so staff notice from the document
    list, since there's no card view left to notice it from.
  - **UMKM pins reuse the `umkm` document, not a new `place.category`.** Patik
    (the reference project) has a `place`-equivalent "umkm" category; adding
    one here would let staff describe the same business twice — once under
    UMKM, once under Tempat Umum — with no guarantee the two copies agree.
    `toMapPins()` merges both document types into one pin list instead. A UMKM
    pin always opens Google Maps on click even when `googleMapsUrl` is empty —
    it falls back to a `?q=<lat>,<lng>` link built from its own coordinates.
  - **Custom Studio input (`sanity/schemaTypes/components/locationInput.tsx`),
    not a plugin.** `sanity-plugin-leaflet-input` stopped at Sanity v2 (2022);
    `@sanity/google-maps-input` would drag the Google billing requirement back
    in through the side door. The custom input is a small Leaflet map with a
    draggable pin plus a Nominatim-backed name search — no key, same reasoning
    as the public map.
  - **GeoJSON overlays (`public/geojson/`) are optional and independent.** Three
    fixed filenames — `batas-kelurahan.geojson`, `jalan.geojson`,
    `sungai.geojson` — each fetched separately; a missing one is skipped, not an
    error, so the map works before any of them exist. `src/lib/geojson.ts`
    accepts either real GeoJSON (what QGIS exports) or Esri JSON (`rings`/
    `paths` — what patik-map-website's sample files use), since both circulate
    as ".geojson" files in practice and Leaflet only understands the former.
- [X] **Phase 4 — Deploy polish.** SEO metadata, `sitemap.ts`, `robots.ts`,
  generated OG card, favicon, `src/lib/site.ts`, `docs/`. Verified 2026-07-27:
  build/lint/tsc/50 tests clean, and a test post reached the live site in
  seconds (`{"revalidated":true}` in the webhook log).
  - **`opengraph-image.tsx` must live in `src/app/(site)/`, not `src/app/`.**
    With no root layout at `src/app/`, a file-convention OG image placed there
    is silently ignored: the build passes and every page ships without
    `og:image`. Only visible by fetching a page and grepping the meta tags.
  - **The webhook header value must carry no surrounding quotes.** The route
    compares with `!==`, so a quoted value 401s every delivery and the only
    symptom is stale pages. Cost time once; don't reintroduce it.
  - **A 200 in the attempt log isn't proof.** When the payload maps to no pages
    the route still returns 200, with `revalidated: false` — which happens if
    the projection drops `_type`. Read the response body, not the status.
  - `NEXT_PUBLIC_SITE_URL` is intentionally **empty**. `src/lib/site.ts` uses
    `||`, not `??`, so an empty value falls through to Vercel's own production
    URL instead of winning the chain and handing `new URL("")` an empty string
    to throw on. Give it a real value at the Phase 5 cutover.
- [ ] **Phase 5 — Domain + handover.** `.go.id` via PANDI, DNS cutover, account
  transfers, staff walkthrough. **Split from Phase 4 on purpose:** bureaucratic
  rather than technical, and blocked on an institutional email the kelurahan
  controls, so it moves on a different clock from anything in the repo. Specified
  in `docs/domain-go-id.md` and `docs/handover.md`.
  - One domain covers both faces: `<domain>` is the public site, `<domain>/admin`
    is Studio, since Studio is embedded in the same Next app. Hence the cutover
    re-runs `npx sanity cors add <origin> --credentials`.
  - Still owed: real screenshots in `docs/panduan-staf.md` and the contact names
    at its end.
- [ ] **Phase 6 — Demographics (post-launch, not started).** No schema and no
  page exist yet — `demographicStat` was removed as unused weight while this
  phase sits unbuilt; recreate it if the phase resumes (flat rows: `statType`,
  `year`, `label`, `value`, `unit`). Then: a server component that groups the
  rows by `statType`, one Recharts client component per chart. **Deliberately
  last** — the site launches and hands over without it, and the kelurahan is
  unlikely to supply real numbers before handover. `/demografi` stays unlinked
  and out of `sitemap.ts` until built.

## Handover (the project's actual end state)

**The developer intends to hand this over and stop maintaining it.** That drives
decisions that otherwise look like overkill. Runbook: `docs/handover.md`.

**Nothing may stay on the developer's personal accounts.** A service on a
personal email makes the dev a permanent single point of failure — staff
couldn't add a colleague, resolve a billing notice, or recover access. Sanity,
Vercel, GitHub and the domain all move to a **kelurahan-controlled email**.

**Every content editor is an Administrator.** Confirmed 2026-07-27: Sanity's
Free tier has **2 roles only — Administrator and Viewer** (20 seats). Viewer is
read-only, so anyone publishing a berita needs Administrator. The restricted
Editor role is a paid Growth feature, and upgrading breaks the Rp 0 constraint.

- Good: staff can invite their own colleagues; handover isn't hostage to one
  account.
- Bad: they can also change project settings and delete the dataset. **The
  safeguard is written, not technical** — hence section 9 of
  `docs/panduan-staf.md`. Reinforce it verbally during the walkthrough.
- Use **Viewer** for anyone who only needs to look.

**Individual accounts, Google sign-in preferred** — not a shared login. Password
resets are the commonest support request, and Google sign-in routes them to
Google instead of the dev. Shared accounts break 2FA, make revision history
useless for "who changed this?", and turn staff turnover into password
redistribution. Invites are per **email address** and must match the Google
account exactly.

**Transfer order** (detail in `docs/handover.md`): institutional email → **create
the three receiving accounts** → Sanity (**transfer, never recreate** — keeps the
project ID, so env vars and CORS keep working) → GitHub → Vercel (**Hobby, never
a Team** — paid, no benefit at this scale) → DNS → verify end-to-end. The real
risk is a half-finished transfer that looks fine until the next content edit
silently stops deploying.

- The runbook assumes the kelurahan starts with **only a Gmail address**, and
  that **nobody there has ever set up two-factor auth**. Both shape step 1.
  **Sign up for Vercel via GitHub and Sanity via Google** — not by email. That
  isn't just convenience: Vercel then rides GitHub's login and Sanity rides
  Google's, so the number of accounts needing their own 2FA drops from four to
  **two**, and GitHub's 2FA is mandatory regardless. Enrol two people's phones
  from the same QR code, print the recovery codes, and prove them by actually
  logging in with one before leaving — step 1d.
- **Moving the Vercel project can change the `*.vercel.app` address.** Pages
  follow it automatically (`NEXT_PUBLIC_SITE_URL` is empty by design), but the
  Sanity CORS origin and the webhook URL do not — and both fail silently: the
  first walls off `/admin`, the second stops publishing without any error. They
  get updated twice: once on the account move, once at the domain cutover.

### The honest limit

Content editing becomes fully self-service; **code maintenance does not.**
Within a few years a dependency or platform change will need a developer for a
few hours, and nobody at the kelurahan can do that. Two things soften it: the
site is static/ISR, so a broken build or Sanity outage leaves the last published
version serving from cache rather than taking the site down; and the
documentation means *any* developer can pick it up, not specifically this one.

## Demographics (Phase 6 priority order — planning notes only, no schema yet)

Each would be fed by a `demographicStat` document (removed for now — see
Phase 6 above; recreate it if this phase resumes):

1. **Distribusi Usia** (bar/pyramid, 0–14/15–64/65+) — labor pool + dependency
   ratio.
2. **Tingkat Pendidikan** (horizontal bar, Tidak Sekolah→SD→SMP→SMA/SMK→D/S1+).
3. **Mata Pencaharian** (pie/bar: Petani, Pedagang/UMKM, Buruh, Jasa, PNS,
   Lainnya) — clearest signal of local economic activity.
4. **Akses Infrastruktur** (% listrik, air bersih, sanitasi, internet) — gating
   factor for investment.

Dropped from `statType` in Phase 1: Tren Pertumbuhan Populasi, Klasifikasi
Kesejahteraan. Deprioritized as resident-only: religion, marital status, gender
ratio alone. The flat schema absorbs additions with no schema change.

## Cost 2026

Vercel + Sanity free tier (Rp 0). Domain **TBD** — a kelurahan is a government
instansi, so `.go.id`, **not** `.desa.id`; don't assume `.desa.id` pricing or
paperwork. Confirm with PANDI / Dinas Kominfo before Phase 5 —
`docs/domain-go-id.md` holds the question list and a table for the answers.
