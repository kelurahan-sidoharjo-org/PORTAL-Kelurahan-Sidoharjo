import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getSiteSettings } from "@/lib/sanity/client";

/**
 * CATATAN: footer tidak muncul di mockup design-reference mana pun — ini
 * keputusan sendiri, sengaja dibuat minimal supaya mudah dihapus kalau
 * desainnya memang dimaksudkan berakhir di section terakhir.
 */
export async function Footer() {
  const settings = await getSiteSettings();
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

          {/* Untuk staf kelurahan, bukan warga — sengaja dibuat tidak
              mencolok. Ini ada di sini supaya panduannya bertahan lepas dari
              developer: staf bisa menemukannya dari halaman mana pun di HP
              mana pun tanpa perlu diberi tautan. */}
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
