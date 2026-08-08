import Image from "next/image";
import { imageProps } from "@/lib/sanity/image";
import type { StaffMember } from "@/lib/sanity/types";

/** Foto, lalu jabatan di atas nama — urutan yang dipakai mockup. */
export function StaffCard({ member }: { member: StaffMember }) {
  const photo = imageProps(member.photo);

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-square bg-muted">
        {photo && (
          <Image
            {...photo}
            alt={member.name}
            sizes="(min-width: 1024px) 20vw, 45vw"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="px-3 py-4 text-center">
        <p className="font-heading text-xs sm:text-sm font-bold">{member.position}</p>
        <p className="text-base text-brand-navy sm:text-lg">{member.name}</p>
      </div>
    </li>
  );
}
