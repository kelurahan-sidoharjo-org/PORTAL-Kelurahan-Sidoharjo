import { ImageResponse } from "next/og";
import { siteName } from "@/lib/site";

/**
 * The default link-preview card, for pages with no cover photo of their own —
 * the homepage, /peta, /umkm and friends. Berita and Prestasi articles override
 * it with their own coverImage in generateMetadata.
 *
 * Generated at build time by next/og (built into Next, no extra dependency)
 * rather than exported from Figma, so it stays in sync with the brand colours
 * in globals.css and adds no asset for staff to maintain after handover.
 *
 * ImageResponse supports only a subset of CSS — flexbox only, and no webfonts
 * unless you load them explicitly. Kept deliberately plain: this renders once
 * per build and never appears on the site itself.
 */
export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mirrors --brand / --brand-navy / --page-top in globals.css.
const BRAND = "#2c694e";
const BRAND_NAVY = "#002046";
const PAGE_TOP = "#f8f6f0";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: `linear-gradient(160deg, ${BRAND_NAVY} 0%, ${BRAND} 100%)`,
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.05em",
            color: PAGE_TOP,
            opacity: 0.75,
          }}
        >
          Kab. Wonogiri, Kec. Sidoharjo
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          Kelurahan Sidoharjo
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 38,
            color: PAGE_TOP,
            opacity: 0.9,
          }}
        >
          Berita · Prestasi · UMKM · Peta
        </div>
      </div>
    ),
    size,
  );
}
