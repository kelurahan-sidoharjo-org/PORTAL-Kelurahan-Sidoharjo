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

// Mirrors --page-top / --page-bottom in globals.css.
const PAGE_TOP = "#f8f6f0";
const PAGE_BOT = "#e9f6eb";

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
          // The `0%` is load-bearing: a bare `%` is not a valid colour stop, so
          // the whole declaration used to be discarded and the card rendered on
          // an empty background — invisible locally, only wrong in the preview
          // WhatsApp and Google draw from the deployed page.
          background: `linear-gradient(160deg, ${PAGE_TOP} 0%, ${PAGE_BOT} 100%)`,
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: "0.05em",
            color: "#000000",
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
            color: "#000000",
          }}
        >
          Kelurahan Sidoharjo
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 38,
            color: "#000000",
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
