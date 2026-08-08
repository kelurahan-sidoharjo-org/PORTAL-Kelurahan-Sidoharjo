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
   * Tanpa metadataBase, path gambar Open Graph jadi URL relatif — bekerja
   * di browser, tapi WhatsApp dan Google membacanya dari luar dan
   * membuangnya, jadi tautan yang dibagikan kehilangan preview.
   */
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    // Halaman menyetel judul telanjang ("Berita Kelurahan"); ini menambahkan
    // sufiksnya, jadi cukup berada di satu tempat alih-alih diketik ulang
    // di tiap halaman.
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
          Gradiennya CSS, bukan PNG 227 KB di design-reference/. Layer
          tetap, bukan `bg-fixed`, karena background-attachment: fixed
          tidak bisa diandalkan di iOS Safari.
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
