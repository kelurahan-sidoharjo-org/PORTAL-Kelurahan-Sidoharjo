/**
 * Definisi <clipPath> untuk tepi bawah hero yang bergelombang.
 *
 * Dipakai sebagai clip (memotong hero-nya), bukan sebagai SVG berwarna yang
 * ditempel di atas hero seperti kebanyakan contoh di internet. Alasannya:
 * latar halaman ini gradien `fixed` (lihat `(site)/layout.tsx`), jadi warna
 * tepat di bawah gelombang berubah saat pembaca menggulir — sebuah SVG
 * ber-fill solid akan cocok di satu posisi scroll saja lalu meleset. Dengan
 * memotong hero-nya, yang terlihat di bawah gelombang adalah gradien itu
 * sendiri, jadi selalu pas.
 *
 * clipPathUnits="objectBoundingBox" berarti semua koordinat adalah pecahan
 * 0..1 dari kotak hero. Gelombangnya jadi ikut melar mengikuti lebar layar
 * tanpa satu pun media query, dan kedalamannya proporsional (±4,5% tinggi
 * hero — sekitar 36 px pada hero setinggi layar).
 *
 * Jangan sembunyikan <svg> ini dengan `display: none`/`hidden`: sebagian
 * browser berhenti menemukan clipPath-nya. Ukuran nol sudah cukup.
 */
export function HeroWave() {
  return (
    <svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute size-0"
    >
      <defs>
        <clipPath id="hero-wave" clipPathUnits="objectBoundingBox">
          <path
            d="M0,0 H1 V0.9712
               L0.9444,0.96696
               C0.8889,0.9624 0.7778,0.9544 0.6667,0.9584
               C0.5556,0.9624 0.4444,0.98 0.3333,0.984
               C0.2222,0.988 0.1111,0.98 0.0556,0.97544
               L0,0.9712 Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
