import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { LAYOUT_SENTINEL, pathsFor, type WebhookBody } from "@/lib/revalidate";

/**
 * Sanity webhook target: rebuilds affected pages the moment content is
 * published, instead of waiting out the hour-long ISR window.
 *
 * Auth is a shared secret sent as a header. The stricter option is Sanity's
 * signed webhooks (`@sanity/webhook` + `isValidSignature`), which also proves
 * the body wasn't tampered with — worth upgrading to if this endpoint ever
 * does more than bust a cache, but it's another dependency to keep alive past
 * handover and this route only triggers rebuilds.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    // Misconfiguration, not a client error — say so plainly in the log.
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

  // Echoed back so a failing webhook is diagnosable from Sanity's delivery log.
  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}
