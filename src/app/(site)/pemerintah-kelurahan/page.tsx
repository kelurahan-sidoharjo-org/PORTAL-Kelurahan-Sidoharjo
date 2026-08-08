import type { Metadata } from "next";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { StaffCard } from "@/components/pemerintah/StaffCard";
import { getSiteSettings, sanityFetch } from "@/lib/sanity/client";
import { imageFillProps, imageProps } from "@/lib/sanity/image";
import { staffMembersQuery } from "@/lib/sanity/queries";
import type { StaffMember } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kantor Kelurahan",
  description:
    "Struktur organisasi, perangkat kelurahan, dan kontak resmi Kantor Kelurahan Sidoharjo.",
  alternates: { canonical: "/pemerintah-kelurahan" },
};

export default async function PemerintahKelurahanPage() {
  const [settings, staff] = await Promise.all([
    getSiteSettings(),
    sanityFetch<StaffMember[]>(staffMembersQuery),
  ]);

  const office = imageFillProps(settings?.officeImage);
  const orgChart = imageProps(settings?.orgChartImage);
  const villageName = settings?.villageName ?? "Sidoharjo";

  return (
    <>
      {/* Hero + header bersama-sama mengisi satu layar. svh (bukan vh)
          supaya toolbar browser mobile tidak mendorong bagian bawah ke
          luar tampilan. */}
      <section className="relative isolate flex min-h-[calc(100svh_-_var(--header-height))] items-center overflow-hidden bg-brand-navy">
        {office && (
          <Image
            {...office}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        {/* Menjaga teks putih tetap terbaca apa pun foto yang diunggah staf. */}
        <div className="absolute inset-0 bg-brand-navy/50" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 text-white drop-shadow-2xl sm:px-6 sm:py-16">
          <BackButton className="sm:bg-white/15 sm:backdrop-blur-lg hover:text-white hover:bg-white/20" />
          <h1 className="mt-6 text-xl tracking-[-0.05em] sm:text-4xl">
            Kantor Kelurahan {villageName}
          </h1>

          {/* w-fit supaya panelnya mepet ke baris kontak alih-alih
              meregang selebar hero-nya. */}
          <div className="mt-4 w-fit space-y-1.5 rounded-lg bg-white/15 px-5 py-2.5 text-xs font-medium backdrop-blur-lg sm:text-base">
            {settings?.contactWhatsapp && (
              <p className="flex items-center gap-2">
                <Image
                  src="/images/ic-whatsapp.png"
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="size-5 shrink-0"
                />
                {settings.contactWhatsapp}
              </p>
            )}
            {settings?.contactEmail && (
              <p className="flex items-center gap-2">
                <Image
                  src="/images/ic-gmail.png"
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="size-5 shrink-0"
                />
                {settings.contactEmail}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {settings?.contactWhatsapp && (
              <a
                href={`https://wa.me/${settings.contactWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                // bg-brand/85, bukan solid: backdrop-blur cuma terlihat lewat
                // background yang translusen.
                className="rounded-lg bg-brand/85 px-10 py-3 font-heading text-xs font-bold text-white backdrop-blur-md transition-opacity hover:bg-brand/100 sm:text-sm"
              >
                Hubungi
              </a>
            )}
            {settings?.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/70 bg-white/10 px-6 py-3 text-xs font-medium backdrop-blur-md transition-colors hover:bg-white/20 sm:text-sm"
              >
                <MapPin className="size-4" aria-hidden />
                lihat peta
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl bg-white/30 p-5 shadow-sm sm:p-10">
          <h2 className="text-center text-lg sm:text-2xl">
            Struktur Organisasi
          </h2>
          {orgChart ? (
            /* Wrapper membatasi lebarnya; gambarnya menyesuaikan di dalam
               batas itu maupun batas tinggi, jadi bagannya dan judulnya
               tetap dalam satu layar setinggi apa pun bagan yang diunggah
               staf. */
            <div className="mx-auto mt-6 flex max-w-3xl justify-center">
              <Image
                {...orgChart}
                alt="Struktur organisasi kelurahan"
                sizes="(min-width: 1024px) 900px, 100vw"
                className="h-auto max-h-[calc(100svh_-_10rem)] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <p className="mt-6 text-center text-xs text-muted-foreground sm:text-sm">
              Bagan struktur organisasi belum diunggah.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-center text-lg sm:text-2xl">Anggota Kelurahan</h2>
        {staff.length > 0 ? (
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {staff.map((member) => (
              <StaffCard key={member._id} member={member} />
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Data perangkat kelurahan belum diisi.
          </p>
        )}
      </section>
    </>
  );
}
