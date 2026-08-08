"use client";

/**
 * Menangkap error render di mana pun di dalam grup (site). TIDAK
 * menangkap error yang dilempar oleh (site)/layout.tsx sendiri — Header
 * dan Footer bersifat async dan keduanya mengambil siteSettings, jadi
 * kegagalan level layout perlu src/app/global-error.tsx sebagai
 * gantinya, yang merender <html>/<body> sendiri.
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
