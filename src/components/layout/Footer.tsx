import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";

/**
 * NOTE: no footer appears in any of the design-reference mockups — this is a
 * judgement call, kept deliberately minimal so it's easy to delete if the
 * design is meant to end at the last section.
 */
export async function Footer() {
  const settings = await client.fetch<SiteSettings | null>(siteSettingsQuery);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/5 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs sm:px-6 sm:text-sm">
        <p className="font-heading font-bold">
          Kelurahan {settings?.villageName ?? "Sidoharjo"}
        </p>

        <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:gap-6">
          {settings?.contactWhatsapp && (
            <a
              href={`https://wa.me/${settings.contactWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-brand"
            >
              <WhatsAppIcon className="size-4" />
              {settings.contactWhatsapp}
            </a>
          )}
          {settings?.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="inline-flex items-center gap-2 hover:text-brand"
            >
              <Mail className="size-4" aria-hidden />
              {settings.contactEmail}
            </a>
          )}

          {/* For kelurahan staff, not warga — deliberately understated. It's
              here so the guide survives the developer: staff can find it from
              any page on any phone without being handed a link. */}
          <Link
            href="/panduan"
            className="inline-flex items-center gap-2 hover:text-brand"
          >
            <BookOpen className="size-4" aria-hidden />
            Panduan Staf
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          © {year} Kelurahan {settings?.villageName ?? "Sidoharjo"}, Kecamatan
          Sidoharjo, Kabupaten Wonogiri.
        </p>
      </div>
    </footer>
  );
}
