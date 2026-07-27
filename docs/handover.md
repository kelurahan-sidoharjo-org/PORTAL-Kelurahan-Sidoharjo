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
- [ ] **Every staff member who edits content is a Sanity Administrator.** Not a
  choice — the Free plan has exactly **two roles, Administrator and Viewer**
  (confirmed 2026-07-27; 20 seats available, which is plenty). Viewer is
  read-only, so anyone publishing a berita needs Administrator. There is no
  restricted Editor role on this plan, and upgrading to get one breaks the Rp 0
  running cost the project is built around.
  - This removes a problem: staff can invite their own colleagues without the
    developer, so the handover isn't hostage to one account.
  - It adds another: **any of them can change project settings or delete the
    dataset.** Nothing in the software prevents it, so the protection has to be
    the staff guide plus a spoken explanation. Cover this in the walkthrough at
    step 6 — don't rely on the document alone.
  - Give **Viewer** to anyone who only needs to look: someone in training, or a
    camat who wants visibility without edit rights.

## 1. Sanity — transfer, do not recreate

- [ ] In sanity.io/manage, transfer project ownership to the institutional email
- [ ] Keep the developer's account as an Administrator (do **not** remove it)
- [ ] Confirm every staff member appears, and that content editors are
      Administrators rather than Viewers — a Viewer will hit a read-only Studio
      and reasonably report it as broken
- [ ] **Confirm the plan reads "Free", not "Growth trial".** The trial expires
      on its own and downgrades automatically. Nothing is deleted, and the two
      webhooks survive, but asset storage drops from 100 GB to 5 GB — so don't
      let the trial's headroom encourage bulk-uploading full-size photos that
      won't fit afterwards. See the storage budget in `README.md`.

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

1. **The site fails safe.** Pages are static and cached at Vercel's edge, so a
   broken build or a Sanity outage leaves the last published version serving
   normally rather than taking the site down.
2. **Any developer can pick this up.** The architecture, the reasoning behind
   each decision, and the known trade-offs are documented in `CLAUDE.md` and
   `README.md`. It is not specific to the person who built it.
