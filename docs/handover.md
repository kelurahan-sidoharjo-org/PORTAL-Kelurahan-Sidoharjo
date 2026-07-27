# Handover runbook

The end state this project is built for: **the kelurahan owns everything, and
the developer keeps a seat on each service as a best-effort safety net.**
Ownership and billing move; access stays.

Work top to bottom — each step assumes the one above it is done.

---

## 0. Prerequisites

Neither of these is technical, and both are slower than the work that follows.
Start them first.

- [ ] **An institutional email the kelurahan controls.** Not a staff member's
  personal Gmail — that just relocates the single point of failure from the
  developer to one individual. Every account below gets registered to this
  address. This is the blocking dependency for the entire runbook.
- [ ] **At least one staff member is a Sanity Administrator.** Editors can write
  content but cannot invite people. If the developer is the only
  Administrator, staff can never onboard a colleague and the handover is
  cosmetic — every problem still escalates to the developer by default.
  Promote the most computer-comfortable person, often the sekretaris.
  Everyone else stays **Editor**: create, edit and publish content, but no
  project settings and no dataset deletion.

## 1. Sanity — transfer, do not recreate

- [ ] In sanity.io/manage, transfer project ownership to the institutional email
- [ ] Demote the developer's account to Administrator (do **not** remove it)
- [ ] Confirm every staff member appears with the right role

**Transfer keeps the project ID.** That single fact is why this must never be
done by recreating the project: the ID is baked into `.env.local`, the Vercel
environment variables, and the CORS allowlist. A new project means a new ID, a
dataset export/import, and re-adding every CORS origin — all avoidable.

## 2. GitHub — transfer the repository

- [ ] Transfer the repo to an account or organisation on the institutional email
- [ ] Re-add the developer as a collaborator
- [ ] Confirm the commit history came across intact

**Expect the Vercel↔GitHub link to break here.** That is normal; step 3 repairs
it. Don't try to fix it from the GitHub side.

## 3. Vercel — transfer the project

- [ ] Transfer to a kelurahan-owned **Hobby** account
- [ ] Re-authorise the GitHub connection
- [ ] Confirm every environment variable survived (see the table in `README.md`)
- [ ] Push a trivial commit and confirm it still triggers a deploy

**Do not create a Vercel Team.** It is a paid tier, it breaks the Rp 0 running
cost this project is designed around, and at this scale it buys nothing.

## 4. Domain and DNS

Only once steps 1–3 are done and a test deploy is green. See
[domain-go-id.md](./domain-go-id.md) for the registration process.

- [ ] Point the domain at the Vercel project
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel to the new address, then redeploy
- [ ] `npx sanity cors add https://<new-domain> --credentials`
- [ ] Update the webhook URL in sanity.io/manage → API → Webhooks

`.go.id` is kelurahan-owned from the moment it is registered, so there is
nothing to transfer — only to point.

## 5. Verify end to end — not optional

**In this order**, because each step depends on the last:

- [ ] Publish a test post in Studio
- [ ] Sanity's webhook delivery log shows **200**
- [ ] The post appears on the live domain within seconds
- [ ] Upload an image via **Select** and confirm it still auto-resizes
- [ ] Delete the test post and confirm it disappears from the live site

The real risk this catches is a **half-finished transfer** — GitHub moved,
Vercel never reconnected — which looks perfectly fine until the next content
edit silently stops deploying, possibly weeks later with nobody able to connect
cause and effect.

If any step fails, the previous owner still holds access, so nothing is
unrecoverable. That is why verification comes before revoking anything.

## 6. Hand over the documents

- [ ] Fill in the contact names at the end of
  [panduan-staf.md](./panduan-staf.md)
- [ ] Take the screenshots that guide asks for, from a real logged-in Studio
- [ ] Walk one staff member through publishing a real berita, start to finish,
  while they drive and you watch

That last one matters more than the document. A guide nobody has ever followed
is a guide nobody will follow.

---

## The limit, stated plainly

This belongs in writing because future staff will never have met the developer,
and because an unwritten expectation always defaults to "call the developer."

**Content editing becomes fully self-service. Code maintenance does not.**

Adding berita, prestasi, UMKM entries, staff, places, photos and site settings
is entirely in the kelurahan's hands after handover, and requires no developer.

What still needs a developer, eventually: within a few years some dependency or
platform change will need a few hours of work from someone who writes code.
Nobody at the kelurahan can do that, and the original developer's help is
**best-effort and voluntary — not a maintenance commitment.**

Two things soften this considerably:

1. **The sit****e fails safe.** Pages are static and cached at Vercel's edge, so a
   broken build or a Sanity outage leaves the last published version serving
   normally rather than taking the site down.
2. **Any developer can pick this up.** The architecture, the reasoning behind
   each decision, and the known trade-offs are documented in `CLAUDE.md` and
   `README.md`. It is not specific to the person who built it.
