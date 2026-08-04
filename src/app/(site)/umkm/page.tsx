import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/PageHeading";
import { UmkmCard } from "@/components/umkm/UmkmCard";
import { sanityFetch } from "@/lib/sanity/client";
import { umkmListQuery } from "@/lib/sanity/queries";
import type { Umkm } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "UMKM Lokal",
  description:
    "Direktori usaha mikro, kecil, dan menengah milik warga Kelurahan Sidoharjo.",
  alternates: { canonical: "/umkm" },
};

export default async function UmkmPage() {
  const items = await sanityFetch<Umkm[]>(umkmListQuery);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeading>UMKM Lokal</PageHeading>

      {items.length > 0 ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <UmkmCard key={item._id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          Belum ada UMKM yang terdaftar.
        </p>
      )}
    </div>
  );
}
