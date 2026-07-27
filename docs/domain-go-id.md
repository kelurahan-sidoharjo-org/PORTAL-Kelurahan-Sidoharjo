# Domain `.go.id` — what to find out

**This is a list of questions, not a list of answers.** `.go.id` requirements,
documents and fees are set by PANDI and the relevant ministry, and they change.
Anything written here from memory would be stale by the time somebody acts on
it — and a wrong assumption about a government registration process costs weeks.

So: use this as a call sheet. Ask, then write the answers into the table at the
bottom and commit it.

## Why `.go.id` and not `.desa.id`

A **kelurahan** is a government instansi under the camat, staffed by civil
servants — administratively different from a **desa**, which has its own elected
head and village government. `.desa.id` is for desa. Sidoharjo is a kelurahan,
so `.go.id` is the correct namespace.

Practical consequence: **do not budget using `.desa.id` prices or paperwork.**
They are different processes with different requirements.

## Before calling anyone

- [ ] Confirm the institutional email exists (see [handover.md](./handover.md)
      step 0). Registration will be tied to it, and doing this with a personal
      address recreates the exact problem the handover is meant to solve.
- [ ] Agree internally on the domain name you want, plus a second choice.
- [ ] Identify who at the kelurahan is authorised to sign — registration is an
      institutional act, not something a developer can do on their behalf.

## Who to ask

1. **Dinas Kominfo Kabupaten Wonogiri** — start here. They handle this for
   instansi in the regency routinely, and may already have a standing process
   (or an existing subdomain arrangement) that skips most of the work below.
2. **PANDI** (pandi.id) — the registry itself, for anything Kominfo can't answer.

## Questions to ask, in order

**Eligibility and process**

- [ ] Is a kelurahan eligible to register a `.go.id` directly, or must it go
      through the kabupaten? (This one question can change everything below.)
- [ ] Would we get our own domain, or a subdomain under the kabupaten's existing
      domain? A subdomain is often faster and free — and works fine here.
- [ ] Which documents are required? (Typically some combination of a permohonan
      letter on official letterhead, a surat kuasa, and identification for the
      authorised applicant — **confirm, don't assume**.)
- [ ] Who must sign, and at what level?
- [ ] Is the requested name available?

**Cost and renewal**

- [ ] What is the registration fee, if any? `.go.id` is often free or nominal
      for verified instansi — but confirm rather than planning around it.
- [ ] What is the renewal period and cost?
- [ ] **Who receives the renewal notice, and at which address?** An expired
      domain takes the site offline with no warning to anyone. Make sure it goes
      to the institutional email, not an individual.
- [ ] Is there a budget line this has to go through, and what is its timeline?

**Technical** — the only part that concerns the site itself

- [ ] Can we set our own DNS records (specifically an `A` record and a `CNAME`)?
      This is required to point the domain at Vercel. If DNS is managed by
      Kominfo, we simply send them the two values; that is fine, just slower.
- [ ] How long does a DNS change take to be applied?

## What happens on our side once the domain exists

Small by design — four steps, all reversible:

1. Add the domain in the Vercel project settings; Vercel shows the exact DNS
   records to create.
2. Set `NEXT_PUBLIC_SITE_URL` to `https://<domain>` in Vercel, then redeploy.
   This is the single value that updates page metadata, link previews,
   `sitemap.xml` and `robots.txt` — see `src/lib/site.ts`.
3. `npx sanity cors add https://<domain> --credentials`, so `/admin` keeps
   working on the new address.
4. Update the webhook URL in sanity.io/manage → API → Webhooks.

Then re-run the end-to-end check in [handover.md](./handover.md) step 5.

**Don't do any of this early.** Adding a guessed origin or a domain that isn't
registered yet leaves stale entries for a future developer to puzzle over, with
no way to tell which are real.

---

## Answers — fill in as you get them

| Question | Answer | Date | Who told us |
| --- | --- | --- | --- |
| Eligible directly, or via kabupaten? | | | |
| Own domain or subdomain? | | | |
| Documents required | | | |
| Who signs | | | |
| Registration fee | | | |
| Renewal period + cost | | | |
| Renewal notice goes to | | | |
| Can we manage our own DNS? | | | |
| Expected timeline | | | |

**Chosen domain:** ..............................................

**Registered on:** ...............  **Renews:** ...............
