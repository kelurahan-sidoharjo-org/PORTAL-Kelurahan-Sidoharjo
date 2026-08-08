import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/sanity/client";

/**
 * Sama di tiap halaman: lambang + wordmark di kiri, tautan sosial di kanan.
 *
 * Lambangnya adalah aset statis, bukan field Sanity — itu emblem
 * pemerintah yang tetap. Lihat CLAUDE.md ("The header logo is static").
 */
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="bg-white">
      {/* Tinggi tetap supaya hero layar-penuh bisa menguranginya dengan tepat. */}
      <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo-kelurahan.png"
            alt=""
            width={96}
            height={96}
            priority
            // PNG tetap yang sudah pas ukurannya — melewati loader Sanity
            // (itu cuma meresize URL cdn.sanity.io) dan optimizer Next.
            unoptimized
            className="h-11 w-auto object-contain sm:h-12"
          />
          <span className="leading-tight">
            <span className="block font-heading text-[0.6rem] font-bold leading-none tracking-[0.14em] sm:text-xs">
              KELURAHAN
            </span>
            <span className="block font-heading text-base font-extrabold tracking-tight sm:text-2xl">
              {(settings?.villageName ?? "Sidoharjo").toUpperCase()}
            </span>
            <span className="block text-[0.55rem] font-semibold text-muted-foreground sm:text-[0.65rem]">
              Kab. Wonogiri, Kec. Sidoharjo
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {settings?.instagramUrl && (
            <SocialLink
              href={settings.instagramUrl}
              icon="/images/ic-instagram.png"
              label="Instagram"
            />
          )}
          {settings?.tiktokUrl && (
            <SocialLink
              href={settings.tiktokUrl}
              icon="/images/ic-tiktok.png"
              label="TikTok"
            />
          )}
        </nav>
      </div>
    </header>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      <Image
        src={icon}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-9 w-9 sm:h-10 sm:w-10"
      />
    </a>
  );
}