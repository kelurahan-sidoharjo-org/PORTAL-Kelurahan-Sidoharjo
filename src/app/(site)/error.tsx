"use client";

/**
 * Catches render errors anywhere inside the (site) group. Does NOT catch
 * errors thrown by (site)/layout.tsx itself — Header and Footer are async
 * and both fetch siteSettings, so a layout-level failure needs
 * src/app/global-error.tsx instead, which renders its own <html>/<body>.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mt-12 flex flex-col items-center gap-6 text-center">
        <h1 className="text-lg sm:text-3xl">Terjadi Kesalahan</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Halaman ini gagal dimuat. Silakan coba lagi beberapa saat lagi.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-heading text-xs sm:text-sm font-bold text-white transition-shadow hover:shadow-md"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
