import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import "../globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  /**
   * Without metadataBase, Next emits Open Graph image paths as relative URLs.
   * They resolve fine in a browser that already knows what site it's on, but
   * WhatsApp and Google read the page from outside and simply drop them — so
   * shared links lose their preview image.
   */
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    // Pages set a bare title ("Berita Kelurahan"); this appends the suffix, so
    // it lives in one place instead of being retyped on every page.
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName,
    url: siteUrl,
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-transparent">
        {/*
          Gradient is CSS, not the 227 KB background PNG in design-reference/.
          Painted as a fixed layer rather than `bg-fixed` on <body>, because
          background-attachment: fixed is unreliable on iOS Safari. A negative
          z-index keeps it above the body background but behind all content.
        */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-gradient-to-b from-page-top from-25% to-page-bottom"
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
