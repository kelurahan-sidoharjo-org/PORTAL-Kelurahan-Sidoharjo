# Portal Kelurahan Sidoharjo

* [ ] 

## Rules for the assistant

- **NO COMMITTING.** Never run `git commit`/`git push` unless the user asks in
  that exact message. Leave changes for the user to review.
- **NO BUILDING.** Never run `npm run build` unless the user asks. It takes
  ~60s and the user runs it themselves. `npm run lint` and `npm test` are cheap
  (~15s) and fine to run when verifying a change.
- **READ BOTH MOCKUPS BEFORE BUILDING A PAGE.** Open
  `design-reference/<page>-desktop.png` **and** `<page>-mobile.png` before
  writing any of it — not just the desktop one, and not only when something
  looks wrong afterwards. Mobile is a different layout, not the desktop one
  narrowed: on `beranda` alone it changes the Layanan grid to 3 columns,
  left-aligns headings that are centred on desktop, and turns the Berita row
  into a horizontal swipe carousel. None of that is inferable from the desktop
  frame. The same applies when *revising* a page — re-read both, since a
  request phrased about one breakpoint usually affects the other.

## Stack

Next.js (App Router) + Tailwind + shadcn/ui → Vercel Hobby. Sanity.io + Studio
embedded at `/admin` (Indonesian field labels; editors are non-technical).
Recharts for `demographicStat`. Montserrat (headings) / Poppins (body).

No database, no forms, no server-side writes — fully read-only static/ISR. No
public accounts, no login on the public site. Editors are several kelurahan
staff with individual Sanity accounts (see Handover).

### Local dev

- **`npm run dev`** is the normal loop. **`npm run build` takes ~60s** — ~40s of
  it is bundling Studio (one 4 MB chunk; 841 packages, 51 under `@sanity/`).
  That cost is fixed, not proportional to page count, so it won't grow much in
  later phases. Build at phase boundaries, not on every change.
- **`vitest.config.ts` needs something to teach Vite the `@/` alias** from
  `tsconfig.json` — Vitest does not pick it up on its own. Verified 2026-07-26
  on Vite 8.1.5: `resolve: { tsconfigPaths: true }` is now native and works, so
  the `vite-tsconfig-paths` plugin is gone. **Before Vite 8 that option did not
  exist**, and Vite ignores unknown config keys silently, which is how the old
  note came to say it was never real — tests failed with
  `Cannot read properties of undefined (reading 'config')`. If you ever
  downgrade Vite, the plugin comes back.
  - **Removing it fails exactly one test file**, so the breakage reads as flaky
    rather than as a config error. Only `utils.test.ts` imports a *value*
    through `@/`; `places.test.ts` uses `@/` for a `import type` only, which is
    erased before runtime and so resolves fine either way. Don't take a mostly
    green run as proof the alias works.

### Sanity project (settings live outside this repo)

Credentials in `.env.local` (gitignored; see `.env.local.example`). Project is
live and connected; `http://localhost:3000` is already CORS-allowlisted.

**CORS origins are stored on the Sanity project, not in version control** — a
fresh clone or new project hits a "Connect this Studio" wall at `/admin` until
allowlisted. `--credentials` is required (Studio sends the login session, not
just public reads):

```bash
npx sanity cors add http://localhost:3000 --credentials   # npx sanity cors list
```

Add the deployed origin at Phase 4, once the final domain is settled, rather
than accumulating stale origins now.

## Content model — `sanity/schemaTypes/*`, aggregated in `index.ts`

- **`siteSettings`** (singleton): `tiktokUrl`, `instagramUrl`,
  `villageName`, `heroVideoUrl`, `contactEmail`, `contactWhatsapp`,
  `googleMapsUrl`, `orgChartImage`, `kelurahanMapImage` (shown on `/peta`),
  `officeImage` (hero photo on `/pemerintah-kelurahan`). No `contactAddress` —
  dropped on purpose.
- **`post`** — Berita + Prestasi merged (near-identical fields); `/berita` and
  `/prestasi` are separate pages filtering on `category`: `title`, `slug`,
  `category` (`berita`|`prestasi`), `publishedAt` (both — also groups
  Prestasi by year), `coverImage`, `images` (→ "Dokumentasi" section on
  detail page), `excerpt`, `body`.
  - `slug` and `category` are auto-set and **hidden** — staff never see them.
  - `publishedAt` is **prefilled with today but left visible and editable**, so
    older announcements can be backdated. Deliberate: fully hiding it would make
    backdating impossible.
- **`place`**: `name`, `category`
  (`pemerintahan`|`masjid`|`sekolah`|`toko`|`lainnya` — drives icon AND filter),
  `googleMapsUrl`. No photo/description/address.
- **`staffMember`**: `name`, `position`, `photo`, `order`.
- **`umkm`**: `businessName`, `description`, `photo`, `contactUrl`,
  `googleMapsUrl` (optional — the "lihat peta" button renders only when it's
  filled). No `category` (dropped in Phase 1).
- **`demographicStat`** (flat rows, added one at a time): `statType`, `year`,
  `label`, `value`, `unit`.
- **`blockContent`**: portable text for `post.body`.

## Images

Two homes: **Sanity CDN** for anything staff edit (via
`src/lib/sanity/image.ts`); **`public/images/`** for fixed Figma design assets.

Asset storage is the only metered resource that grows. Two separate concerns:

- **Display:** serve via Sanity CDN transform URLs (`?w=…&auto=format` →
  auto-WebP), NOT Vercel's optimizer (Hobby quota). Automatic once wired.
- **Storage (5 GB):** Sanity keeps the **raw original**; `auto=format` does not
  shrink it. **auto-resize-on-upload** (client-side downscale to ~1600px) is
  wired into Studio behind the **Select** button, but it is *not* the only
  path — `directUploads` is **on**, so drag-and-drop still accepts raw photos.
  Forcing the resize made Sanity render a greyed-out "Can't upload files here",
  which non-technical staff read as a broken field; usability won. Image field
  descriptions recommend Select (`schemaTypes/uploadHint.ts`). **The cost is
  time, not correctness — see the storage budget table in `README.md`**, which
  is where a future dev should look if uploads start failing.
- Rule: **web-sized originals in, WebP variants out.** Set `cdn.sanity.io` in
  `next.config.js`.

### `public/images/` — exported from Figma

Figma MCP is quota-exhausted (Starter: 6 calls/month), so exports are manual.
**All assets are exported and correctly named — the list is complete.**

Naming: `ic-<name>.png`, kebab-case. Place icons are `ic-place-<category>.png`
matching the `place.category` enum exactly, so `/peta` resolves them
mechanically (`` `/images/ic-place-${category}.png` ``) with no mapping table.

- Header (all pages): `ic-instagram`, `ic-tiktok`
- `/pemerintah-kelurahan` hero contact lines: `ic-whatsapp`, `ic-gmail`
  (full-colour brand marks). The Footer keeps the inline-SVG `WhatsAppIcon`
  instead, because it tints with `currentColor` and needs the hover colour
  change — a PNG can't do that.
- Homepage Layanan: `ic-kantor-kelurahan`, `ic-peta`, `ic-umkm`, `ic-prestasi`
- `/peta` cards: `ic-place-{pemerintahan,masjid,sekolah,toko,lainnya}`
- `/prestasi`: `ic-trophy` (×2)

**Two trophies, easy to confuse:** `ic-prestasi` is gold/glossy, homepage
Layanan only. `ic-trophy` is a white glyph on a dark-green circle, used on
`/prestasi` as both the timeline year marker and the stand-in thumbnail for
cards with no `coverImage`. Figma uses a third (indigo on lavender) for that
stand-in — **deliberately dropped, `ic-trophy` reused instead. Don't "fix" it.**

**Settled:** the 4 Layanan icons are bespoke flat-vector assets, not emoji —
they merely read like 🏛 🗺 🏪 🏆 at a glance. Use the files.

**From Sanity, never exported:** `siteSettings.orgChartImage` /
`.kelurahanMapImage` / `.officeImage`, `post.coverImage` / `.images`,
`staffMember.photo`, `umkm.photo`. Video thumbnail is YouTube's own (iframe via
`heroVideoUrl`).

**The header logo is static**, not from Sanity: `logo-kelurahan.png` (the
Wonogiri regency seal). It's a fixed government emblem, so `siteSettings.logo`
was dropped rather than left as a control that does nothing — an unused field in
Studio actively misleads staff after handover.

**Generic UI icons → `lucide-react`**, not exports: arrows, calendar, map pin,
back arrow, search.

### Page background — CSS, not an image

`background (desktop|mobile).png` in `design-reference/` is just a vertical
gradient; shipping the 227 KB PNG would be waste. Use
`bg-gradient-to-b from-[#F8F6F0] from-25% to-[#E9F6EB]`.

## Routes

`/` `/berita` `/berita/[slug]` `/peta` `/pemerintah-kelurahan` `/umkm`
`/prestasi` `/demografi` `/admin` (Studio) `/api/revalidate`.

All content pages ISR — readers hit Vercel's edge cache, Sanity is queried only
at build/revalidation, so load scales with content changes, not traffic.

- **On-demand revalidation is not optional** for a news site: Sanity webhook →
  `src/app/api/revalidate/route.ts` so posts appear instantly. Built: POST,
  auth via an `x-revalidate-secret` header matching `SANITY_REVALIDATE_SECRET`,
  mapping `_type` → paths. **The webhook itself is still unconfigured** — set it
  up in sanity.io/manage at Phase 4, once there's a deployed URL (Sanity cannot
  reach `localhost`).
- **`/berita/[slug]` is the shared article route** — it serves Prestasi posts
  too, since `PrestasiCard` links into it. Never filter that query or
  `generateStaticParams` by `category`; doing so 404s every Prestasi article.
- **Paginate `/berita`** — GROQ-slice (`[0...12]`) with load-more/page numbers.
  Design the query with a limit from the start; never render all posts.

## Conventions

- `src/lib/sanity/{client,queries,image}.ts` — central query/client/image layer.
- `src/components/{layout,home,berita,peta,pemerintah,umkm,prestasi,demografi/charts}/*`
- `src/app/(site)/` is the public route group; `/admin` has its own layout so
  Studio doesn't inherit site fonts/chrome.
- `design-reference/` holds design screenshots (gitignored).
- `src/lib/site.ts` — site URL + name + description, the single source for
  `metadataBase`, Open Graph, `sitemap.ts` and `robots.ts`. Server-only.
- `docs/` — handover deliverables: `panduan-staf.md` (staff guide, Bahasa
  Indonesia), `handover.md` (transfer runbook), `domain-go-id.md`.

## Roadmap & progress

A phase is done only when `npm run build`, `npm run lint`, and `npm test` all
pass clean. Fix failures before moving on; don't let them accumulate. (The user
runs the builds — see Rules above.)

- [X] **Phase 0 — Skeleton.** Next.js + Tailwind + shadcn/ui scaffold,
  placeholder homepage, Vercel linked and auto-deploying on push.
- [X] **Phase 1 — Sanity schema + Studio.** All types above; Studio at `/admin`;
  auto-resize-on-upload wired; Vitest + RTL set up; Sanity project connected
  and CORS allowlisted; one of each type created in Studio and verified.
  `slug` is `hidden: true` and derived by a **document-level** input
  (`PostDocumentInput`) — a field-level input can't work, since `hidden`
  unmounts the field and stops the sync. That same input also seeds `excerpt`
  from the first line of `body` — a *default*, not a lock: it tracks the body
  until the editor types their own summary, then backs off.
  **Both auto-patch effects must bail when `props.readOnly` is set.** A
  read-only form (viewing the *Published* version via the perspective switcher,
  an old revision, or a release) rejects every patch, so an unguarded
  `onChange` throws "Attempted to patch a read-only document" and crashes the
  form. Only surfaces on a post that has both a published and a draft version —
  single-version posts never hit the read-only path.
- [X] **Phase 2 — Static pages wired to Sanity.** Build `src/lib/sanity/*`, then
  easiest→hardest: Header/Footer → Pemerintah Kelurahan → UMKM → Prestasi →
  Berita (portable text, dynamic routes, paginated) → homepage. Add
  `/api/revalidate`; serve images via Sanity CDN transforms.
  Homepage is only (per `design-reference/beranda-desktop.png`):
  header/footer → "Layanan" row of 4 static nav icons (Kantor Kelurahan,
  Peta & Tempat Publik, UMKM Lokal, Prestasi Kelurahan — icon + label, no
  preview) → "Berita Kelurahan" with the 3 latest posts + "lihat semua"
  (the only fetched content) → "Video Profil" embed (`heroVideoUrl`).
- [X] **Phase 3 — Peta.** Two columns desktop, stacked mobile:
  `kelurahanMapImage` left, list right. **Static image, not an interactive
  map** — no map library. Right column: search ("Cari Tempat Umum"), filter
  pills, 2-up grid of cards (icon + name + "lihat peta" → `googleMapsUrl`).
  Client-side filter + search. Pills lead with a **"Semua"** state that is not
  a category; every real category shows its full name capitalised
  (`pemerintahan` → "Pemerintahan"), so no category→label map is needed —
  category→icon resolves mechanically too. Places list is **paginated
  client-side** (`PLACES_PER_PAGE = 8`); `presentCategories`/`filterPlaces`/
  `categoryLabel` are pure helpers in `src/lib/places.ts` (unit-tested), so
  `PlaceExplorer` only does state + rendering. Empty states: "Belum ada tempat
  yang terdaftar." (nothing seeded) vs "Tidak ada tempat yang cocok." (filtered
  to none). Map panel shows "Peta belum diunggah." when `kelurahanMapImage` is
  unset.
- [~] **Phase 4 — Deploy polish + domain + handover.** Code and docs are done;
  the domain is not started (it blocks on an institutional email, which is
  bureaucratic rather than technical).
  - Done: env audit (`src/lib/site.ts` resolves the site URL from
    `NEXT_PUBLIC_SITE_URL` → Vercel's own → localhost, so the `.go.id` cutover
    is one env var); `metadataBase`, title template, per-page descriptions,
    per-article Open Graph images from `coverImage`; `sitemap.ts`, `robots.ts`,
    a generated `opengraph-image.tsx`; favicon replaced with the regency seal
    (`src/app/icon.png`); starter SVGs deleted; revalidation webhook and
    production CORS configured; `docs/` written.
  - **No `cdn.sanity.io` image domain is needed** — the custom loader in
    `next.config.ts` bypasses `/_next/image` entirely, so Next never fetches
    remote images and has no host to validate. The old roadmap line was wrong.
  - Remaining: `.go.id` via PANDI, DNS cutover, and the Handover checklist —
    all tracked in `docs/domain-go-id.md` and `docs/handover.md`.
- [ ] **Phase 5 — Demographics (deferred to a post-launch iteration).** Server
  component groups `demographicStat` by `statType`; one Recharts client
  component per chart. **Moved after deploy on purpose:** the other six content
  areas are done, so the site can launch and hand over without the charts, and
  demografi lands as a follow-up iteration once the kelurahan supplies real
  numbers. Not a launch blocker; `/demografi` simply isn't linked until built.

## Handover (the project's actual end state)

**The developer intends to hand this to kelurahan staff and stop maintaining
it.** That drives decisions that otherwise look like overkill — treat this as a
hard requirement, not a nice-to-have.

**Nothing may stay on the developer's personal accounts.** Any service on a
personal email makes the dev a permanent single point of failure — staff
couldn't add a colleague, resolve a billing notice, or recover access without
them. Sanity, Vercel, GitHub, and the domain must all end up under a
**kelurahan-controlled email**.

**At least one staff member must be a Sanity Administrator.** Editors can write
content but cannot invite people, so if the dev is the only Administrator, staff
can't onboard a colleague after handover. Promote the most computer-comfortable
person (often the sekretaris); everyone else stays **Editor** (create/edit/
publish, no project settings, no dataset deletion).

**Individual accounts, Google sign-in preferred** — not a shared login. Password
resets are the most common support request, and Google sign-in routes them to
Google instead of to the dev. Shared accounts also break 2FA (code goes to one
phone), make revision history useless for "who changed this?", and turn staff
turnover into a password-redistribution exercise. Invites are per **email
address** and must match the Google account exactly — ask each person which
Gmail they actually use. Non-Gmail users fall back to email + password.

### Transfer plan (Phase 4, after the site is live and stable)

End state: kelurahan owns everything, **dev keeps a member/collaborator seat on
each service** as a best-effort safety net. Ownership and billing move; access
stays. Access alone is not responsibility — but access *only* by the dev is,
which is why the staff Administrator above is a hard prerequisite. Without it
every problem escalates to the dev by default and handover is cosmetic.

0. **Institutional email — blocking dependency.** The kelurahan needs one email
   they control (not a staff personal Gmail, which just relocates the single
   point of failure). Everything below depends on it. Start here: it's
   bureaucratic, not technical, and will be the slowest part.
1. **Sanity — transfer, do not recreate.** Transfer keeps the project ID, so
   `.env.local`, Vercel env vars, and the CORS allowlist all keep working.
   Recreating means a new project ID, dataset export/import, and re-adding CORS.
   Verify the current flow in sanity.io/manage, then demote the dev account to
   Administrator rather than removing it.
2. **GitHub — transfer the repo.** History and commits move with it. Re-add the
   dev as collaborator. Expect the Vercel↔GitHub link to break; step 3 fixes it.
3. **Vercel — transfer to a kelurahan-owned Hobby account.** Do **not** create a
   Vercel *Team* — paid tier, breaks the Rp 0 goal, no benefit at this scale.
   Then re-authorize the GitHub connection, confirm push still triggers a
   deploy, and re-check env vars survived.
4. **Domain + DNS** — only after 1–3 land and a test deploy is green. `.go.id`
   is kelurahan-owned from registration, so there's nothing to transfer; just
   point it at the now-kelurahan-owned Vercel project.
5. **Verify end-to-end, in this order:** publish a test post in Studio → webhook
   fires → it appears on the live domain → image upload still auto-resizes. Then
   delete the test post. If any step fails, the previous owner still holds
   access, so nothing is unrecoverable. **Not optional** — the real risk is a
   half-finished transfer (GitHub moved, Vercel never reconnected) that looks
   fine until the next content edit silently stops deploying.
6. **Write the limit down.** The staff guide must state that dev access is
   best-effort, not a maintenance commitment — for future staff who never met
   the dev. That's the difference between a safety net and unpaid on-call.

### Staff guide — written, see `docs/panduan-staf.md`

**Bahasa Indonesia**, plain language, no assumed computer skills: how to log in,
add a berita/prestasi, upload a photo **via Select** (with the storage reason
spelled out), edit `siteSettings`, and who to contact. Converts "the developer
knows how it works" into "the kelurahan knows how it works."

Two things still owed on it: the `![tangkapan layar: …]` placeholders need real
screenshots from a logged-in Studio, and the contact names at the end need
filling in. Both are listed in `docs/handover.md` step 6.

### The honest limit

Content editing becomes fully self-service; **code maintenance does not.**
Within a few years a dependency or platform change will need a developer for a
few hours, and nobody at the kelurahan can do that. Two things soften it: the
site is static/ISR, so a broken build or Sanity outage leaves the last published
version serving from Vercel's cache rather than taking the site down; and good
documentation means *any* developer can pick it up, not specifically this one.

## Demographics (investor/collaborator lens)

Priority order, each fed by `demographicStat`:

1. **Distribusi Usia / Rasio Usia Produktif** (bar/pyramid, 0–14/15–64/65+) —
   labor pool size + dependency ratio.
2. **Tingkat Pendidikan** (horizontal bar, Tidak Sekolah→SD→SMP→SMA/SMK→D/S1+)
   — workforce skill/trainability.
3. **Mata Pencaharian** (pie/bar: Petani, Pedagang/UMKM, Buruh, Jasa, PNS,
   Lainnya) — clearest signal of local economic activity.
4. **Akses Infrastruktur** (grouped bar/stat tiles: % listrik, air bersih,
   sanitasi, internet) — hard gating factor for investment.

Dropped in Phase 1 (not in `statType`'s options): Tren Pertumbuhan Populasi,
Klasifikasi Kesejahteraan. Deprioritized as resident-only: religion, marital
status, gender ratio alone. The flat schema absorbs additions with no changes.

## Cost 2026

Vercel + Sanity free tier (Rp 0). Domain **TBD** — kelurahan is a government
instansi, so `.go.id`, **not** `.desa.id`. Often fee-free for verified instansi,
but confirm requirements/cost with PANDI or Dinas Kominfo before Phase 4; do not
assume the old `.desa.id` price.
