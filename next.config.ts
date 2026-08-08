import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tiap gambar diresize CDN Sanity, bukan optimizer Vercel yang diukur
    // kuotanya di paket Hobby. Dikonfigurasi global karena next/image adalah
    // Client Component dan prop function `loader` tidak bisa dilewatkan
    // dari server component.
    //
    // Tidak butuh `remotePatterns`: loader kustom melewati /_next/image
    // sepenuhnya, jadi Next tidak pernah mengambil gambar remote sendiri
    // dan tidak ada host yang perlu divalidasi.
    loader: "custom",
    loaderFile: "./src/lib/sanity/imageLoader.ts",
  },
};

export default nextConfig;
