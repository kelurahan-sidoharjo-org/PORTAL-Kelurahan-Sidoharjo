import Image from "next/image";
import Link from "next/link";

/**
 * Four static nav shortcuts — no previews, no fetching. The icons are bespoke
 * flat-vector exports, not emoji, despite reading like 🏛 🗺 🏪 🏆 at a glance.
 */
const LAYANAN = [
  { href: "/pemerintah-kelurahan", icon: "ic-kantor-kelurahan", label: "Kantor Kelurahan" },
  { href: "/peta", icon: "ic-peta", label: "Peta & Tempat Publik" },
  { href: "/umkm", icon: "ic-umkm", label: "UMKM Lokal" },
  { href: "/prestasi", icon: "ic-prestasi", label: "Prestasi Kelurahan" },
] as const;

export function LayananNav() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Left-aligned on mobile, centred from sm: up — matches both frames. */}
      <h2 className="text-lg sm:text-center sm:text-2xl">Layanan</h2>

      <ul className="mt-6 grid grid-cols-3 gap-4 sm:mt-8 sm:grid-cols-4">
        {LAYANAN.map(({ href, icon, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5 sm:gap-3"
            >
              <Image
                src={`/images/${icon}.png`}
                alt=""
                width={96}
                height={96}
                unoptimized
                // drop-shadow (not shadow) so the glow follows the icon's
                // shape rather than boxing its transparent PNG bounds.
                className="size-10 object-contain transition-[filter] duration-200 group-hover:drop-shadow-lg sm:size-16"
              />
              <span className="text-xs sm:text-base">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
