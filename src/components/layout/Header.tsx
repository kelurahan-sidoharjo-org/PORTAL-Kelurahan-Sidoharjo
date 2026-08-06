import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/sanity/client";

/**
 * Same on every page: seal + wordmark left, social links right.
 *
 * The seal is a static asset, not a Sanity field — it's a fixed government
 * emblem. See CLAUDE.md ("The header logo is static").
 */
export async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className="bg-white">
      {/* Fixed height so full-screen heroes can subtract it exactly. */}
      <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo-kelurahan.png"
            alt=""
            width={96}
            height={96}
            priority
            // A fixed, pre-sized PNG — skip the Sanity loader (it only resizes
            // cdn.sanity.io URLs) and Next's optimizer.
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