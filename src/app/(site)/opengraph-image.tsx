import { ImageResponse } from "next/og";
import { siteName } from "@/lib/site";

/**
 * Kartu preview-tautan bawaan untuk halaman tanpa cover sendiri — beranda,
 * /peta, /umkm. Artikel Berita/Prestasi menimpanya di generateMetadata.
 *
 * Digenerate saat build oleh next/og (bawaan Next) alih-alih diekspor
 * dari Figma, supaya selaras dengan warna brand dan tidak menambah aset
 * yang harus dipelihara staf.
 *
 * ImageResponse cuma mendukung flexbox, tanpa webfont eksplisit. Sengaja
 * sederhana: dirender sekali per build, tidak pernah muncul di situsnya sendiri.
 */
export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mencerminkan --page-top / --page-bottom di globals.css.
const PAGE_TOP = "#f8f6f0";
const PAGE_BOT = "#e9f6eb";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          // `0%` bukan hiasan: `%` telanjang bukan color stop valid, dulu
          // seluruh deklarasi dibuang dan kartunya render di background
          // kosong — cuma salah di preview WhatsApp/Google, tidak lokal.
          background: `linear-gradient(160deg, ${PAGE_TOP} 0%, ${PAGE_BOT} 100%)`,
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.05em",
            color: "#000000",
            opacity: 0.75,
          }}
        >
          Kab. Wonogiri, Kec. Sidoharjo
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#000000",
          }}
        >
          Kelurahan Sidoharjo
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 38,
            color: "#000000",
            opacity: 0.9,
          }}
        >
          Berita · Prestasi · UMKM · Peta
        </div>
      </div>
    ),
    size,
  );
}
