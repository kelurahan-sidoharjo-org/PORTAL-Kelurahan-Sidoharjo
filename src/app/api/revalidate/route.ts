import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { LAYOUT_SENTINEL, pathsFor, type WebhookBody } from "@/lib/revalidate";

/**
 * Target webhook Sanity: membangun ulang halaman begitu konten
 * dipublikasikan, alih-alih menunggu jendela ISR satu jam.
 *
 * Autentikasinya shared secret lewat header. Opsi lebih ketat adalah
 * webhook bertanda tangan Sanity (`isValidSignature`), layak di-upgrade
 * kalau endpoint ini suatu saat lebih dari sekadar membersihkan cache —
 * tapi itu satu dependensi lagi yang harus dijaga lepas serah terima.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    // Kesalahan konfigurasi, bukan kesalahan client — katakan itu dengan jelas di log.
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET is not set" },
      { status: 500 },
    );
  }

  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const paths = pathsFor(body);
  if (paths.length === 0) {
    return NextResponse.json({
      revalidated: false,
      message: `No pages mapped for type "${body._type ?? "unknown"}"`,
    });
  }

  for (const path of paths) {
    if (path === LAYOUT_SENTINEL) revalidatePath("/", "layout");
    else revalidatePath(path);
  }

  // Digemakan kembali supaya webhook yang gagal bisa didiagnosis dari log pengiriman Sanity.
  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}
