# Portal Kelurahan Sidoharjo

Website resmi Kelurahan Sidoharjo. Tidak ada database, tidak ada formulir,
tidak ada penulisan di sisi server. Situs publik hanya menyajikan konten
statis/ISR dari Sanity.

<br>

## Tech stack

- **[Next.js](https://nextjs.org/docs)** (App Router) + **[TypeScript](https://www.typescriptlang.org/docs/)**
- **[Tailwind](https://tailwindcss.com/docs)** + **[shadcn/ui](https://ui.shadcn.com)**
- **[Sanity.io](https://www.sanity.io/docs)** + Studio, disematkan (embedded) di `/admin`
- **[Recharts](https://recharts.org)** untuk `/demografi` (Fase 6, belum dibangun)
- **[Vercel Hobby](https://vercel.com/docs)** untuk hosting, ISR (biaya tidak tergantung traffic)
- **[Vitest](https://vitest.dev)** + **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** untuk testing

<br>

## Pengembangan

Setup terdiri dari lima langkah berurutan, setiap langkah bergantung pada
langkah sebelumnya.

<br>

### 1. Dapatkan akses Sanity

Buat atau minta diundang ke proyek Sanity sebelum langkah lain bisa
berjalan. Minta admin proyek untuk mengundang Anda sebagai Administrator
(atau Viewer jika hanya perlu membaca). Setelah diundang, cari **project
ID** dan **nama dataset** di [sanity.io/manage](https://sanity.io/manage) → proyek terkait → Settings → API. Keduanya dipakai di langkah berikutnya.

<br>

### 2. Atur environment

```bash
cp .env.local.example .env.local
```

- Isi `NEXT_PUBLIC_SANITY_PROJECT_ID` dan `NEXT_PUBLIC_SANITY_DATASET`
  dengan nilai dari langkah 1. Variabel lain boleh dikosongkan untuk
  pengembangan lokal.
- `NEXT_PUBLIC_SITE_URL` dan `SANITY_REVALIDATE_SECRET` hanya dibutuhkan
  untuk deployment.
- `SANITY_WRITE_TOKEN` hanya jika Anda berencana mengisi (seed) konten
  (langkah 5).

<br>

### 3. Login dan izinkan akses Studio lokal

```bash
npx sanity login
npx sanity cors add http://localhost:3000 --credentials
```

- `sanity login` membuka browser untuk autentikasi CLI — perintah CORS
  butuh sesi tersebut (`--credentials` mengirimkannya), kalau tidak akan
  gagal.
- Langkah ini **hanya untuk `/admin`**; halaman publik tetap berjalan
  tanpanya. Tanpa `--credentials` pada perintah CORS, sesi login Studio
  ditolak dan `/admin` menampilkan layar "Connect this Studio". Origin CORS
  tersimpan di proyek Sanity, bukan di repo ini, jadi clone baru perlu
  mengulang langkah ini.

<br>

### 4. Install dan jalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Jika langkah 1–2 terlewat atau salah, aplikasi melempar error saat startup yang menyebutkan project ID Sanity yang hilang.

<br>

### 5. Isi konten contoh (opsional, hanya jika halaman terlihat kosong)

Dataset Sanity yang baru atau pribadi **tidak punya konten** — daftar berita, tempat (places), dan UMKM akan tampil kosong, yang terlihat seperti bug padahal hanya dataset kosong. `scripts/seed.mjs` mengisi konten dummy (tanpa foto):

```bash
node scripts/seed.mjs                                  # dry run — hanya print, tidak menulis apa pun
node --env-file=.env.local scripts/seed.mjs --commit   # menulis; butuh SANITY_WRITE_TOKEN
```

`SANITY_WRITE_TOKEN` tidak ada di `.env.local` secara default — buat di sanity.io/manage → API → Tokens dengan izin Editor, dan jangan pernah tambahkan ke Vercel (lihat tabel environment variable di bawah untuk alasannya).

<br>

### Perintah

| Perintah               | Kegunaan                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`        | Server pengembangan lokal                                                                                                                              |
| `npm run lint`       | ESLint — ringan, aman dijalankan sesering mungkin                                                                                                     |
| `npm test`           | Vitest, sekali jalan                                                                                                                                   |
| `npm run test:watch` | Vitest, mode watch                                                                                                                                     |
| `npm run build`      | Build produksi —**~60 detik**, sebagian besar untuk membundel Studio jadi satu chunk. Biaya tetap, tidak perlu dijalankan tiap perubahan kecil. |
| `npm start`          | Menjalankan build produksi secara lokal                                                                                                                |

<br>

## Struktur proyek

```
src/
  app/(site)/    # route group publik — berita, peta, pemerintah-kelurahan, umkm, prestasi, panduan
  app/admin/     # Sanity Studio yang disematkan, punya root layout sendiri (tanpa font/chrome situs)
  app/api/revalidate/
  components/    # layout, home, berita, peta, pemerintah, umkm, prestasi, ui
  lib/           # site.ts (URL/metadata situs), lib/sanity/{client,queries,image,imageLoader,env}.ts
sanity/          # schemaTypes (model konten), assetSources (downscale gambar di sisi klien)
docs/            # panduan-staf.md, handover.md, domain-go-id.md — semua Bahasa Indonesia
```

Konvensi yang lebih detail dan alasan di balik tiap keputusan ada di
[CLAUDE.md](./CLAUDE.md) (Bahasa Inggris) — tidak diulang di sini.

<br>

## Dokumentasi

- **[docs/panduan-staf.md](./docs/panduan-staf.md)** — panduan staf. Cara login, publikasi berita, upload foto. **Juga disajikan di `/panduan`** (dirender langsung dari file ini, ditautkan di footer, `noindex` dan tidak dimasukkan ke sitemap).
- **[docs/handover.md](./docs/handover.md)** — runbook serah terima, dan pernyataan jujur soal apa yang bisa dan tidak bisa dilakukan kelurahan tanpa developer — termasuk bagian penutup soal dukungan apa yang dijanjikan dan tidak.
- **[docs/domain-go-id.md](./docs/domain-go-id.md)** — daftar pertanyaan untuk PANDI / Dinas Kominfo sebelum mendaftarkan domain.
- **[CLAUDE.md](./CLAUDE.md)** — arsitektur, model konten, dan alasan di balik tiap keputusan. Mulai dari sini kalau Anda baru mengambil alih proyek ini.

<br>

## Deployment

Next.js di Vercel Hobby, konten dari Sanity. Halaman bersifat ISR: dibangun satu kali, di-cache di edge, di-refresh tiap 1 jam *atau* langsung lewat webhook di bawah.

<br>

### Environment variables

| Variable                          | Vercel?          | Kegunaan                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Ya               | Proyek Sanity mana yang dibaca. Publik — memang sengaja ikut terkirim ke browser.                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_SANITY_DATASET`    | Ya               | `production`. Default ke nilai ini kalau kosong.                                                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_SITE_URL`          | Ya               | URL situs absolut, tanpa trailing slash. Dipakai untuk metadata, link preview,`sitemap.xml`, `robots.txt`. Fallback ke URL produksi Vercel, jadi opsional sampai domain asli aktif — lalu ini jadi *satu-satunya* perubahan sisi kode yang dibutuhkan saat cutover. Lihat `src/lib/site.ts`. |
| `SANITY_API_VERSION`            | Opsional         | Tanggal API yang di-pin. Harus sama dengan`sanity.config.ts`.                                                                                                                                                                                                                                       |
| `SANITY_REVALIDATE_SECRET`      | Ya               | Secret bersama untuk webhook di bawah.                                                                                                                                                                                                                                                                |
| `SANITY_WRITE_TOKEN`            | **Jangan** | Hanya lokal, untuk`scripts/seed.mjs`. Situs yang di-deploy bersifat read-only dan tidak butuh write key.                                                                                                                                                                                            |

**Vercel membaca environment variable saat build.** Menambah atau mengubah
satu variabel tidak berefek apa pun ke situs yang sedang berjalan sampai di-redeploy.

<br>

### Webhook revalidasi on-demand

Tanpa ini, postingan yang dipublikasi butuh waktu sampai satu jam untuk
muncul. Atur di sanity.io/manage → API → Webhooks:

| Setting     | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| URL         | `https://<site>/api/revalidate`                                 |
| Method      | POST                                                              |
| Dataset     | `production`                                                    |
| Trigger on  | Create, Update, Delete                                            |
| Filter      | `_type in ["post","siteSettings","staffMember","umkm","place"]` |
| Projection  | `{_type, slug}`                                                 |
| HTTP header | `x-revalidate-secret` = nilai dari `SANITY_REVALIDATE_SECRET` |

Route membandingkan header itu dengan environment variable secara exact
match, jadi **nilainya tidak boleh diapit tanda kutip** dan harus identik di kedua tempat. Kalau tidak cocok, hasilnya 401 dan gagal secara diam-diam — situs terus menyajikan halaman lama. Cek delivery log Sanity untuk status `200` dengan `{ revalidated: true }`.

<br>

### CORS

Studio disematkan di `/admin`, jadi tidak ada yang perlu didaftarkan ke Sanity — hanya origin browser yang perlu di-allowlist:

```bash
npx sanity cors add https://<site> --credentials   # npx sanity cors list
```

`--credentials` wajib: Studio mengirim sesi login, bukan sekadar akses baca publik. Tanpa itu, `/admin` menampilkan layar "Connect this Studio". Origin tersimpan di proyek Sanity, **bukan di version control**, jadi clone baru atau domain baru perlu mengulang langkah ini.

<br>

## Kuota Penyimpanan gambar

**Satu-satunya resource yang diukur dan terus bertambah seiring waktu.**
Tier gratis Sanity mengizinkan **5 GB aset**, dan Sanity selalu menyimpan *file asli*. (menyajikan tampilan versi yang di-resize, tetapi tidak mengecilkan file yang tersimpan). Tidak ada hal lain di proyek ini yang menumpuk: situsnya statis, tidak ada database, dan traffic gratis.

<br>

### Trade-off yang diambil

Studio punya asset source custom (`sanity/assetSources/`) yang men-downscale gambar ke ~1600px **di browser, sebelum upload**. Bisa diakses lewat tombol **Select** di field gambar mana pun. Drag-and-Drop tidak disarankan karena menyimpan size asli dari gambar.

**Biaya dari pilihan ini adalah waktu.** Perkiraan kasar — foto HP mentah
~4 MB, versi resize ~300 KB, dan satu post berita membawa sekitar 9 gambar
(1 cover + ~8 di galeri Dokumentasi):

| Frekuensi posting | Kalau staf drag-and-drop foto mentah | Kalau staf pakai Select |
| ----------------- | ------------------------------------ | ----------------------- |
| 1 post / bulan    | ~12 tahun                            | ~190 tahun              |
| 2 post / bulan    | ~6 tahun                             | ~80 tahun               |
| 1 post / minggu   | ~3 tahun                             | ~35 tahun               |

Galeri Dokumentasi mendominasi angka ini. Post dengan 2 foto alih-alih 8
kira-kira membuat tiap angka di kolom kiri jadi tiga kali lebih kecil.

<br>

### Yang harus dilakukan developer berikutnya

Kegagalan yang realistis adalah upload mulai diam-diam gagal beberapa
tahun setelah handover, ketika sudah tidak ada yang maintain situs ini.
Kalau Anda yang mengambil alih proyek ini:

1. **Cek penggunaan aktual dulu** — sanity.io/manage → project → Usage.
   Jangan bertindak berdasarkan estimasi di atas; angka itu mengasumsikan
   frekuensi posting yang belum pernah diverifikasi.
2. **Kalau penyimpanan naik lebih cepat dari perkiraan**, pertimbangkan tier berbayar setelah semua itu. 

<br>

## Pengembangan ke depan

Pekerjaan sisi developer yang masih terbuka di codebase (tidak termasuk
pendaftaran domain dan logistik handover staf yang ada di
`docs/handover.md` — itu urusan birokrasi, bukan kode):

- **Fase 6 — Demografi.** `/demografi` belum dibangun: server component
  yang mengelompokkan schema `demographicStat` yang sudah ada berdasarkan
  `statType`, satu Recharts client component per chart. Sengaja ditaruh
  terakhir di roadmap — kelurahan belum memberikan angka asli, jadi belum
  ada yang bisa di-chart. Urutan prioritas dan empat chart yang
  direncanakan (distribusi usia, tingkat pendidikan, mata pencaharian,
  akses infrastruktur) ada di `CLAUDE.md`.
- **Penyimpanan gambar.** Lihat bagian anggaran di atas — jalur upload
  drag-and-drop membuat kuota 5 GB tier gratis Sanity naik dalam hitungan
  tahun, bukan langsung. Cek penggunaan aktual di sanity.io/manage sebelum
  bertindak.
- **Maintenance jangka panjang.** Editing konten sepenuhnya self-service
  setelah handover, tapi upgrade kode dan dependency tidak — tidak ada
  orang di kelurahan yang bisa melakukannya. Situs yang bersifat
  static/ISR meredakan ini: build yang rusak atau Sanity down membuat
  versi terakhir yang dipublikasikan tetap disajikan dari edge cache,
  bukan membuat situs down, sehingga ada waktu sampai developer mengambil alih. Lihat "The honest limit" di `CLAUDE.md`.
