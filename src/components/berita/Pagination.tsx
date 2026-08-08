import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageInfo } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Link biasa, tanpa state di sisi client — supaya paging tetap berfungsi
 * tanpa JavaScript dan tiap halaman tetap bisa di-cache dan di-crawl
 * secara independen.
 */
export function Pagination({
  info,
  query,
}: {
  info: PageInfo;
  /** Pencarian `?q=` yang aktif, dibawa ke tiap link halaman supaya paging
   *  lewat hasil pencarian tidak diam-diam kembali ke semua post. */
  query?: string;
}) {
  const { page, totalPages, hasPrev, hasNext } = info;
  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set("q", query.trim());
    // Halaman 1 adalah alamat telanjang, supaya /berita dan
    // /berita?page=1 tidak jadi dua alamat untuk hal yang sama.
    if (n > 1) params.set("page", String(n));
    const search = params.toString();
    return search ? `/berita?${search}` : "/berita";
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-10 flex items-center justify-center gap-2"
    >
      <Step
        href={href(page - 1)}
        enabled={hasPrev}
        label="Halaman sebelumnya"
        icon={<ChevronLeft className="size-4" aria-hidden />}
      />

      {pages.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "grid size-9 place-items-center rounded-full font-heading text-xs sm:text-sm font-bold transition-colors",
            n === page
              ? "bg-brand text-white"
              : "bg-white text-foreground hover:bg-black/5",
          )}
        >
          {n}
        </Link>
      ))}

      <Step
        href={href(page + 1)}
        enabled={hasNext}
        label="Halaman berikutnya"
        icon={<ChevronRight className="size-4" aria-hidden />}
      />
    </nav>
  );
}

/**
 * Dirender sebagai span non-interaktif saat dimatikan — link yang tidak
 * mengarah ke mana pun tetap bisa di-focus dan tetap diumumkan sebagai
 * link, yang menyesatkan screen reader.
 */
function Step({
  href,
  enabled,
  label,
  icon,
}: {
  href: string;
  enabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const base = "grid size-9 place-items-center rounded-full";

  if (!enabled) {
    return (
      <span aria-hidden className={cn(base, "text-muted-foreground/40")}>
        {icon}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(base, "bg-white transition-colors hover:bg-black/5")}
    >
      {icon}
    </Link>
  );
}
