# Panduan Serah Terima

* [ ] 

Panduan ini menganggap kelurahan baru punya satu alamat Gmail dan belum pernah
memakai verifikasi dua langkah. Semua akun gratis; tidak ada yang meminta kartu
kredit.

Kerjakan berurutan dari atas ke bawah.

---

## 0. Sebelum menyentuh apa pun

- [ ] Pastikan Gmail-nya milik kelurahan, bukan milik satu pegawai
- [ ] Tunjuk dua penanggung jawab, jangan satu
- [ ] Tentukan tempat menyimpan sandi dan kode pemulihan — lemari arsip atau
  brankas kantor. Bukan HP satu orang, bukan berkas di komputer
- [ ] Sepakati bahwa semua pengisi konten akan berstatus Administrator Sanity.
  Paket Free hanya punya Administrator dan Viewer (20 kursi), dan Viewer tidak
  bisa menerbitkan. Konsekuensinya mereka juga bisa menghapus dataset — tidak
  ada pengaman di dalam program
- [ ] Beri Viewer kepada siapa pun yang hanya perlu melihat

## 1. Membuat akun

Semua memakai Gmail kelurahan, dikerjakan bersama pengembang dalam satu kali
duduk.

### 1a. Siapkan verifikasi dua langkah

Verifikasi dua langkah = kode sekali pakai dari aplikasi di HP, diminta setelah
sandi. Dari empat layanan, hanya dua yang perlu diatur sendiri:

| Layanan                  | Perlu diatur? | Alasan             |
| ------------------------ | ------------- | ------------------ |
| Google (Gmail kelurahan) | Ya            | akun induk         |
| GitHub                   | Ya            | diwajibkan GitHub  |
| Vercel                   | Tidak         | masuk lewat GitHub |
| Sanity                   | Tidak         | masuk lewat Google |

Anggota kelurahan yang hanya mengisi konten tidak terlibat di bagian ini.

- [ ] Pasang Google Authenticator di kedua HP penanggung jawab
- [ ] Aktifkan pada akun Google kelurahan. Pindai kode QR yang sama dari dua HP
  itu sekaligus
- [ ] Cetak kode pemulihan Google — dua rangkap, bertanggal dan bertanda tangan
- [ ] Jangan pilih SMS

### 1b. GitHub

- [X] Daftar di [github.com](https://github.com) dengan email kelurahan
- [X] Pilih nama pengguna kelembagaan, misalnya `kelurahan-sidoharjo` — tampil
  publik dan merepotkan bila diganti nanti
- [ ] Verifikasi dua langkah diwajibkan. Pindai dari dua HP yang sama
- [ ] Cetak kode pemulihan GitHub, perlakukan sama seperti yang Google
- [ ] Paket Free

### 1c. Vercel

- [ ] Daftar di [vercel.com](https://vercel.com) lewat tombol Continue with GitHub
- [ ] Pilih Hobby, bukan Pro dan bukan Team
- [ ] Jangan memasukkan data kartu

Hobby hanya untuk penggunaan non-komersial; website ini memenuhi syarat.

### 1d. Sanity

- [ ] Masuk ke [sanity.io](https://www.sanity.io) lewat Continue with Google
- [ ] Jangan membuat proyek baru. Proyek `b1xylg02` akan dipindahkan — ID-nya
  tertanam di `.env.local`, di environment variables Vercel, dan di daftar CORS
- [ ] Bila tersedia, buat Organization atas nama kelurahan

### 1e. Buktikan

- [ ] Keluar dari GitHub, masuk kembali memakai satu kode pemulihan dari kertas
- [ ] Cetak ulang daftar kode setelahnya — kode bekas tidak berlaku lagi
- [ ] Masuk ke ketiga layanan dari komputer lain dan dari HP penanggung jawab
  kedua
- [ ] Catat ketiga alamat login, simpan bersama lembar kode pemulihan

## 2. Sanity — pindahkan, jangan buat ulang

- [ ] Di sanity.io/manage, pindahkan kepemilikan proyek `b1xylg02` ke akun atau
  organisasi kelurahan
- [ ] Pertahankan akun pengembang sebagai Administrator
- [ ] Undang pengisi konten dengan akun Google pribadi masing-masing, berstatus
  Administrator
- [ ] Cabut token robot `seeding write token` — dipakai `scripts/seed.mjs`,
  tidak dipakai website, dan masih bisa menghapus isi dataset
- [ ] Pastikan paketnya tertulis "Free", bukan "Growth trial" — saat masa coba
  habis, jatah penyimpanan turun dari 100 GB menjadi 5 GB

Kepemilikan proyek memakai email institusi; login tiap pegawai memakai akun
Google pribadi. Jangan pakai login bersama.

## 3. GitHub — pindahkan repositori

- [ ] Pindahkan repositori ke akun GitHub kelurahan
- [ ] Tambahkan kembali pengembang sebagai collaborator
- [ ] Pastikan riwayat commit ikut berpindah utuh
- [ ] Perbarui remote di komputer pengembang:
  `git remote set-url origin https://github.com/<akun-baru>/<nama-repo>.git`

Sambungan Vercel↔GitHub putus di sini dan diperbaiki di bagian berikutnya.
Halaman yang sudah terbit tetap tersaji selama itu.

## 4. Vercel — pindahkan proyek dan sambungkan ulang

Dua hal yang putus dan harus disambung ulang:

| Bagian            | Letaknya                    | Fungsinya                               |
| ----------------- | --------------------------- | --------------------------------------- |
| Vercel GitHub App | Di akun GitHub              | Izin membaca repo dan menerima commit   |
| Tautan repo       | Di pengaturan proyek Vercel | Menentukan repo dan cabang yang dipakai |

### 4a. Pindahkan proyeknya

- [ ] Dari akun Vercel lama: Project Settings → Transfer Project, tujukan ke
  akun Hobby kelurahan
- [ ] Terima pemindahannya dari akun kelurahan

### 4b. Sambungkan ulang ke GitHub

- [ ] Masuk dengan akun kelurahan, buka Project Settings → Git
- [ ] Klik Disconnect bila repo lama masih tercantum
- [ ] Connect Git Repository → GitHub → beri izin pemasangan Vercel GitHub App
- [ ] Pastikan repo ini termasuk cakupan akses. Bila terlewat, repo-nya tidak
  muncul di daftar Vercel; perbaikannya di GitHub → Settings → Applications →
  Vercel → Configure
- [ ] Pastikan cabang produksinya `main`

### 4c. Periksa yang ikut berpindah

- [ ] Periksa semua environment variable (tabelnya di `README.md`)
- [ ] Kirim satu commit kecil, pastikan deploy berjalan otomatis

### 4d. Alamat `*.vercel.app` bisa berubah

Halaman website menyesuaikan sendiri. Dua hal ini tidak, dan gagal tanpa pesan
apa pun:

- [ ] Catat alamat produksi yang baru
- [ ] `npx sanity cors add https://<alamat-baru> --credentials` — tanpa ini
  `/admin` berhenti di tembok "Connect this Studio"
- [ ] Perbarui alamat webhook di sanity.io/manage → API → Webhooks — tanpa ini
  konten yang diterbitkan berhenti muncul, diam-diam

Jangan membuat Vercel Team; itu paket berbayar.

## 5. Domain dan DNS

Setelah semua langkah di atas selesai dan satu deploy percobaan berhasil.
Proses pendaftarannya di [domain-go-id.md](./domain-go-id.md).

- [ ] Arahkan domain ke proyek Vercel
- [ ] Isi `NEXT_PUBLIC_SITE_URL` di Vercel dengan alamat baru, lalu deploy ulang
- [ ] `npx sanity cors add https://<domain-baru> --credentials`
- [ ] Perbarui lagi alamat webhook di sanity.io/manage → API → Webhooks

CORS dan webhook memang diperbarui dua kali: saat proyek pindah akun, dan saat
domain resmi datang.

## 6. Periksa dari ujung ke ujung

Urut, karena tiap langkah bergantung pada langkah sebelumnya:

- [ ] Terbitkan satu berita percobaan lewat Ruang Kerja
- [ ] Catatan pengiriman webhook di Sanity menunjukkan 200
- [ ] Berita muncul di domain resmi dalam hitungan detik
- [ ] Unggah satu foto lewat Select, pastikan masih mengecil otomatis
- [ ] Buka `/admin` dari alamat resmi, pastikan tidak muncul tembok "Connect
  this Studio"
- [ ] Hapus berita percobaan, pastikan hilang dari website

Jangan mencabut akses pemilik lama sebelum seluruh daftar ini lolos.

## 7. Serahkan dokumennya

- [ ] Isi bagian kontak di akhir [panduan-staf.md](./panduan-staf.md)
- [ ] Ambil empat tangkapan layar yang diminta panduan itu, dari Ruang Kerja
  yang berisi konten nyata. Simpan ke `public/images/panduan/`, lalu ganti
  penanda `![tangkapan layar: …]` dengan penulisan Markdown biasa, misalnya
  `![Halaman masuk Studio](/images/panduan/02-login.png)`
- [ ] Berikan alamat `<website>/panduan` kepada anggota kelurahan
- [ ] Jelaskan secara lisan bagian 9 panduan staf — daftar hal yang tidak boleh
  disentuh
- [ ] Dampingi satu anggota kelurahan menerbitkan satu berita sungguhan, mereka
  yang mengerjakan

## Batas

- Mengisi konten: sepenuhnya bisa dikerjakan kelurahan sendiri.
- Memelihara program: tetap perlu pengembang, kira-kira beberapa jam sekali
  dalam beberapa tahun. Bantuan pengembang aslinya sukarela sebatas kesediaan,
  bukan perjanjian pemeliharaan.
- Bila build gagal atau Sanity terganggu, versi terakhir yang sudah terbit tetap
  tersaji — website tidak mati.
