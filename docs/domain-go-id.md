# Domain `.go.id` — yang perlu dicari tahu

**Ini daftar pertanyaan, bukan daftar jawaban.** Persyaratan, dokumen, dan biaya
`.go.id` ditetapkan oleh PANDI dan kementerian terkait, dan semuanya bisa
berubah. Apa pun yang ditulis di sini dari ingatan sudah akan basi ketika ada
orang yang benar-benar mengerjakannya — dan salah menduga tentang proses
pendaftaran pemerintah berbiaya berminggu-minggu.

Jadi: pakai berkas ini sebagai bahan bertanya. Tanyakan dulu, lalu tulis
jawabannya ke tabel di bagian bawah dan commit.

## Mengapa `.go.id`, bukan `.desa.id`

**Kelurahan** adalah instansi pemerintah di bawah camat yang diisi pegawai
negeri — secara administratif berbeda dari **desa**, yang punya kepala desa
terpilih dan pemerintahan desa sendiri. `.desa.id` diperuntukkan bagi desa.
Sidoharjo adalah kelurahan, jadi `.go.id` adalah ranah yang tepat.

Akibat praktisnya: **jangan menyusun anggaran atau berkas dengan acuan
`.desa.id`.** Keduanya proses yang berbeda dengan persyaratan yang berbeda pula.

## Sebelum menghubungi siapa pun

- [ ] Pastikan email institusi sudah ada (lihat [handover.md](./handover.md)
  langkah 0). Pendaftaran akan diikatkan ke alamat itu, dan mengerjakannya
  dengan alamat pribadi justru mengulang persis masalah yang ingin dihindari
  oleh serah terima ini.
- [ ] Sepakati lebih dulu di internal nama domain yang diinginkan, beserta satu
  pilihan cadangan.
- [ ] Tentukan siapa di kelurahan yang berwenang menandatangani — pendaftaran
  adalah tindakan kelembagaan, bukan sesuatu yang bisa diwakilkan kepada
  pengembang.

## Kepada siapa bertanya

1. **Dinas Kominfo Kabupaten Wonogiri** — mulailah dari sini. Mereka rutin
   mengurus hal ini untuk instansi di kabupaten, dan mungkin sudah punya alur
   baku (atau pengaturan subdomain yang sudah berjalan) yang membuat sebagian
   besar langkah di bawah tidak perlu dikerjakan.
2. **PANDI** (pandi.id) — registrinya langsung, untuk hal yang tidak bisa
   dijawab Kominfo.

## Pertanyaan yang perlu diajukan, berurutan

**Kelayakan dan proses**

- [ ] Apakah kelurahan boleh mendaftarkan `.go.id` secara langsung, atau harus
  melalui kabupaten? (Satu pertanyaan ini bisa mengubah seluruh isi di bawahnya.)
- [ ] Apakah kami akan mendapat domain sendiri, atau subdomain di bawah domain
  kabupaten yang sudah ada? Subdomain sering kali lebih cepat dan gratis — dan
  untuk kebutuhan ini pun sudah memadai.
- [ ] Dokumen apa saja yang diperlukan? (Biasanya berupa gabungan surat
  permohonan di atas kop resmi, surat kuasa, dan identitas pemohon yang
  berwenang — **pastikan, jangan menduga**.)
- [ ] Siapa yang harus menandatangani, dan pada tingkat jabatan apa?
- [ ] Apakah nama yang diminta masih tersedia?

**Biaya dan perpanjangan**

- [ ] Berapa biaya pendaftarannya, kalau ada? `.go.id` sering kali gratis atau
  bernilai kecil bagi instansi yang sudah terverifikasi — tetapi pastikan dulu,
  jangan langsung dijadikan dasar rencana.
- [ ] Berapa masa berlaku dan biaya perpanjangannya?
- [ ] **Siapa yang menerima pemberitahuan perpanjangan, dan ke alamat mana?**
  Domain yang telanjur kedaluwarsa membuat situs mati tanpa peringatan kepada
  siapa pun. Pastikan pemberitahuannya masuk ke email institusi, bukan ke
  perorangan.
- [ ] Apakah ini harus melewati mata anggaran tertentu, dan bagaimana jadwalnya?

**Teknis** — satu-satunya bagian yang menyangkut situsnya sendiri

- [ ] Bisakah kami mengatur sendiri data DNS-nya (khususnya satu `A` record dan
  satu `CNAME`)? Ini diperlukan untuk mengarahkan domain ke Vercel. Bila DNS
  dikelola Kominfo, kami tinggal mengirimkan dua nilai itu kepada mereka; tidak
  masalah, hanya lebih lambat.
- [ ] Berapa lama perubahan DNS berlaku setelah diajukan?

## Yang dikerjakan di sisi kami begitu domainnya ada

Sengaja dibuat sedikit — empat langkah, semuanya bisa dibatalkan:

1. Tambahkan domain di pengaturan proyek Vercel; Vercel akan menampilkan data
   DNS persis yang perlu dibuat.
2. Isi `NEXT_PUBLIC_SITE_URL` dengan `https://<domain>` di Vercel, lalu deploy
   ulang. Ini satu-satunya nilai yang memperbarui metadata halaman, pratinjau
   tautan, `sitemap.xml`, dan `robots.txt` — lihat `src/lib/site.ts`.
3. `npx sanity cors add https://<domain> --credentials`, agar `/admin` tetap
   bekerja di alamat yang baru.
4. Perbarui alamat webhook di sanity.io/manage → API → Webhooks.

Setelah itu, jalankan lagi pemeriksaan ujung ke ujung di
[handover.md](./handover.md) langkah 6.

**Jangan mengerjakan ini lebih awal.** Menambahkan origin tebakan atau domain
yang belum terdaftar hanya meninggalkan entri usang yang membingungkan
pengembang di kemudian hari, tanpa cara membedakan mana yang benar-benar
dipakai.

---

## Jawaban — isi begitu diperoleh

| Pertanyaan                              | Jawaban | Tanggal | Sumber jawaban |
| --------------------------------------- | ------- | ------- | -------------- |
| Boleh langsung, atau lewat kabupaten?   |         |         |                |
| Domain sendiri atau subdomain?          |         |         |                |
| Dokumen yang diperlukan                 |         |         |                |
| Siapa yang menandatangani               |         |         |                |
| Biaya pendaftaran                       |         |         |                |
| Masa berlaku + biaya perpanjangan       |         |         |                |
| Pemberitahuan perpanjangan dikirim ke   |         |         |                |
| Bisakah kami mengelola DNS sendiri?     |         |         |                |
| Perkiraan jangka waktu                  |         |         |                |

**Domain yang dipilih:** ..............................................

**Terdaftar pada:** ...............  **Perpanjangan:** ...............
