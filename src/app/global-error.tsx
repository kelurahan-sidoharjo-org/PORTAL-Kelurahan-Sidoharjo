"use client";

/**
 * Catches errors from (site)/layout.tsx itself — Header and Footer are async
 * and both fetch siteSettings, so a Sanity failure during a rebuild lands
 * here, not in (site)/error.tsx. Renders its own <html>/<body> since there is
 * no root layout at src/app/ to render inside (same reason opengraph-image.tsx
 * has to live in (site)/, not src/app/ — see CLAUDE.md). No site fonts or
 * Tailwind classes: the layout that would normally provide them is the thing
 * that failed.
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
