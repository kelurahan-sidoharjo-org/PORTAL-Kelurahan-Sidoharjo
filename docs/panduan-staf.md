# Panduan Staf — Portal Kelurahan Sidoharjo

Panduan ini untuk perangkat Kelurahan Sidoharjo yang bertugas mengisi isi
situs. Tidak perlu pengalaman komputer khusus. Bila ada langkah yang tidak
cocok dengan yang Anda lihat di layar, hubungi orang yang tercantum di bagian
**Bila Ada Masalah** di halaman terakhir.

---

## 1. Dua bagian yang perlu dipahami

Situs ini terdiri dari dua bagian yang terpisah:

| Bagian | Alamat | Untuk siapa |
| --- | --- | --- |
| **Situs publik** | `{{SITE_URL}}` | Semua orang, tanpa perlu masuk |
| **Ruang Kerja (Studio)** | `{{SITE_URL}}/admin` | Hanya perangkat kelurahan |

Warga hanya melihat situs publik. Semua tulisan, foto, dan data yang muncul di
sana Anda isi lewat Ruang Kerja.

Situs publik **tidak punya tombol login**. Itu memang disengaja: tidak ada akun
warga, tidak ada formulir, tidak ada yang bisa diubah orang luar.

## 2. Masuk ke Ruang Kerja

1. Buka [{{SITE_URL}}/admin]({{SITE_URL}}/admin) — yaitu alamat situs dengan
   tambahan `/admin` di belakangnya. Sebaiknya simpan sebagai bookmark.
2. Pilih **Continue with Google**.
3. Gunakan akun Google Anda sendiri — bukan akun bersama.

![tangkapan layar: halaman masuk Studio dengan tombol "Continue with Google"]

**Setiap orang memakai akun sendiri.** agar:

- Bila lupa sandi, Anda bisa mengurusnya sendiri lewat Google.
- Riwayat perubahan mencatat siapa yang mengubah apa.
- Bila ada pegawai yang pindah tugas, aksesnya tinggal dicabut, tanpa perlu
  mengganti sandi semua orang.

Belum punya akses? Hubungi perangkat kelurahan yang berstatus **Administrator**
(lihat bagian terakhir) dan sebutkan alamat Gmail yang Anda pakai sehari-hari.
Undangan dikirim ke alamat email tertentu, jadi alamatnya harus tepat.

## 3. Mengenal tampilan Ruang Kerja

Setelah masuk, di sisi kiri ada daftar **Konten**:

- **Pengaturan Situs** — data umum: nama kelurahan, kontak, foto kantor, peta
- **Berita** — pengumuman dan kegiatan
- **Prestasi** — penghargaan dan capaian
- **Tempat Umum** — daftar tempat di halaman Peta
- **UMKM** — daftar usaha warga
- **Perangkat Kelurahan** — nama dan jabatan pegawai

![tangkapan layar: daftar Konten di sisi kiri Studio]

## 4. Menambah Berita

1. Klik **Berita** di daftar sebelah kiri.
2. Klik tanda **+** (atau tombol **Create**) di atas daftar.
3. Isi kolom berikut:

| Kolom | Penjelasan |
| --- | --- |
| **Judul** | Wajib diisi. Ini yang muncul besar di halaman berita. |
| **Tanggal Publikasi** | Sudah terisi tanggal hari ini. Ubah bila ingin memasang pengumuman lama. |
| **Isi** | Isi lengkap beritanya. Bisa beberapa paragraf. |
| **Deskripsi Singkat** | Terisi otomatis dari baris pertama **Isi**. Boleh ditimpa bila ingin ringkasan sendiri. |
| **Gambar Sampul** | Satu foto utama. Muncul sebagai gambar kecil di daftar berita. |
| **Dokumentasi** | Foto-foto tambahan. Muncul di bagian bawah halaman berita. |

4. Klik **Publish** di kanan bawah.

![tangkapan layar: formulir Berita yang sudah terisi, dengan tombol Publish]

**Belum siap dipasang?** Tutup saja halamannya. Sanity menyimpan pekerjaan Anda
sebagai *Draft* secara otomatis. Draft **tidak muncul** di situs publik sampai
Anda menekan **Publish**.

## 5. Menambah Prestasi

Sama persis dengan Berita, hanya saja Anda mulai dari menu **Prestasi**.

Yang membedakan: di halaman Prestasi, isinya dikelompokkan **menurut tahun**.
Tahun itu diambil dari **Tanggal Publikasi**. Jadi kalau Anda memasukkan
penghargaan tahun 2023, ubah Tanggal Publikasi ke tahun 2023 — kalau tidak,
penghargaannya akan muncul di kelompok tahun ini.

## 6. Mengunggah foto — mohon lewat "Select"

Ini satu-satunya langkah teknis dalam panduan ini, dan sayang kalau dilewat.

Pada setiap kolom foto ada dua cara mengunggah:

| Cara | Ukuran file | Akibatnya |
| --- | --- | --- |
| **Select** (dianjurkan) | ± 300 KB | Foto diperkecil dulu di komputer Anda |
| Seret & lepas (drag and drop) | ± 4 MB | Foto asli tersimpan apa adanya |

Keduanya berhasil, dan hasilnya di situs terlihat **sama saja**. Bedanya ada di
ruang penyimpanan.

Kelurahan mendapat jatah penyimpanan gratis sebesar 5 GB. Foto dari kamera HP
berukuran sekitar 4 MB. Bila setiap foto diunggah dengan seret & lepas, jatah
itu bisa habis dalam beberapa tahun. Bila lewat **Select**, jatah yang sama
cukup untuk puluhan tahun.

Jadi: **klik tombol Select, jangan menyeret foto ke dalam kotak.**

![tangkapan layar: kolom Gambar Sampul dengan tombol "Select" ditandai]

Setelah memilih **Select**, pilih fotonya seperti biasa. Foto akan diperkecil
sendiri sebelum terkirim. Tidak ada langkah tambahan.

## 7. Mengubah Pengaturan Situs

Klik **Pengaturan Situs** di daftar sebelah kiri. Isinya dipakai di banyak
halaman sekaligus, jadi berhati-hatilah.

| Kolom | Muncul di mana |
| --- | --- |
| **Nama Kelurahan** | Bagian bawah setiap halaman |
| **Video Beranda (YouTube)** | Video di halaman depan |
| **Foto Kantor Kelurahan** | Foto besar di halaman Kantor Kelurahan |
| **Struktur Organisasi** | Bagan di halaman Kantor Kelurahan |
| **Peta Sidoharjo** | Gambar peta di halaman Peta |
| **Email Kontak** | Halaman Kantor Kelurahan dan bagian bawah situs |
| **Nomor WhatsApp** | Halaman Kantor Kelurahan dan bagian bawah situs |
| **Tautan Google Maps Kantor** | Tombol "lihat peta" di halaman Kantor Kelurahan |
| **Tautan Instagram / TikTok** | Ikon di bagian atas setiap halaman |

Jangan lupa **Publish** setelah mengubah.

**Nomor WhatsApp** ditulis dengan kode negara tanpa tanda plus dan tanpa spasi,
misalnya `6281234567890` — bukan `0812-3456-7890`. Kalau formatnya salah,
tombol WhatsApp-nya tetap muncul tetapi tidak membuka percakapan.

## 8. Menambah UMKM, Tempat Umum, dan Perangkat Kelurahan

Ketiganya bekerja dengan cara yang sama: pilih menunya di kiri, klik **+**,
isi, lalu **Publish**.

**UMKM** — Nama Usaha, Deskripsi Singkat, Foto, Tautan Kontak, Tautan Google
Maps. Tautan Google Maps boleh dikosongkan; tombol "lihat peta" hanya muncul
bila kolom itu diisi.

**Tempat Umum** — Nama, Kategori, Tautan Google Maps. **Kategori menentukan
ikonnya** di halaman Peta, jadi pilih yang paling sesuai: Pemerintahan, Masjid,
Sekolah, Toko, atau Lainnya.

**Perangkat Kelurahan** — Nama, Jabatan, Foto, dan **Urutan Tampilan**. Urutan
Tampilan berupa angka: 1 tampil paling awal, lalu 2, 3, dan seterusnya. Biasanya
Lurah diberi angka 1.

## 9. Yang sebaiknya TIDAK diubah

Akun Anda punya wewenang penuh atas situs ini. Itu bukan pilihan kami — paket
gratis Sanity hanya menyediakan dua tingkat akses, dan tingkat yang lebih rendah
sama sekali tidak bisa menulis. Jadi semua orang yang bisa menulis berita juga
bisa mengubah pengaturan teknis.

Artinya: **tidak ada pengaman otomatis.** Program tidak akan menahan Anda.
Karena itu, tolong hindari bagian-bagian berikut.

**Jangan disentuh:**

- **Menu pengaturan proyek** (project settings) di sanity.io/manage — berisi
  pengaturan teknis yang tidak berhubungan dengan isi situs
- **Dataset** — bila dihapus, **seluruh isi situs hilang sekaligus**: semua
  berita, foto, data UMKM, dan perangkat kelurahan. Tidak ada tombol pembatal.
- **Vision** (menu bergambar mata di Ruang Kerja) — alat pemeriksa untuk
  pengembang, bukan untuk mengisi konten
- **API, Tokens, CORS origins, Webhooks** — semuanya sambungan teknis; bila
  diubah, situs bisa berhenti memperbarui diri tanpa pemberitahuan apa pun

**Yang aman Anda kerjakan** adalah semua yang dijelaskan di panduan ini: menu
Berita, Prestasi, Tempat Umum, UMKM, Perangkat Kelurahan, dan Pengaturan Situs.

Ragu-ragu? **Jangan diklik, tanyakan dulu.** Bertanya butuh satu menit;
memulihkan data yang terhapus bisa butuh berhari-hari — atau tidak mungkin sama
sekali.

## 10. Mengubah atau menghapus

- **Mengubah:** klik isinya di daftar, perbaiki, lalu **Publish** lagi.
- **Menghapus:** buka isinya, klik tanda tiga titik di dekat tombol Publish,
  lalu pilih **Delete**.

Salah menghapus? Jangan panik. Sanity menyimpan riwayat perubahan. Hubungi
Administrator — biasanya masih bisa dikembalikan.

## 11. Kapan perubahan muncul di situs?

**Beberapa detik setelah Anda menekan Publish.** Coba muat ulang halamannya
(tekan Ctrl+F5 di komputer, atau tarik layar ke bawah di HP).

Kalau setelah beberapa menit tetap belum berubah, catat waktunya lalu laporkan
ke Administrator. Itu tanda ada sambungan yang perlu diperiksa, bukan kesalahan
Anda.

## 12. Bila ada masalah

Isi bagian ini sebelum panduan dibagikan:

- **Administrator Sanity di kelurahan:**
  Nama ......................................................
  Telepon/WhatsApp ..........................................

- **Email institusi kelurahan:**
  ...........................................................

- **Pengembang situs (bantuan sebatas kesediaan, bukan kontrak
  pemeliharaan):**
  Nama ......................................................
  Kontak ....................................................

**Urutan yang dianjurkan:** coba dulu sendiri → tanya Administrator di
kelurahan → baru hubungi pengembang.

Perlu diketahui dengan jujur: bantuan dari pengembang bersifat sukarela dan
sewaktu-waktu, **bukan perjanjian pemeliharaan**. Mengisi dan mengubah isi
situs sepenuhnya bisa dikerjakan sendiri oleh kelurahan dengan panduan ini.
Yang tetap memerlukan tenaga ahli hanyalah perbaikan pada program situsnya —
dan itu jarang terjadi, mungkin sekali dalam beberapa tahun.
