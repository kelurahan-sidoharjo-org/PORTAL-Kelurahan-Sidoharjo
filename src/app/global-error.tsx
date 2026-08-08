"use client";

/**
 * Menangkap error dari (site)/layout.tsx sendiri — Header/Footer async
 * dan mengambil siteSettings, jadi kegagalan Sanity mendarat di sini,
 * bukan di (site)/error.tsx. Merender <html>/<body> sendiri karena tidak
 * ada root layout di src/app/ (alasan sama seperti opengraph-image.tsx —
 * lihat CLAUDE.md). Tanpa font/class Tailwind: layout yang menyediakan
 * itu adalah yang sedang gagal.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem" }}>Terjadi Kesalahan</h1>
          <p style={{ color: "#666" }}>
            Situs ini gagal dimuat. Silakan coba lagi beberapa saat lagi.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "9999px",
              backgroundColor: "#2c694e",
              color: "white",
              padding: "0.625rem 1.25rem",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
