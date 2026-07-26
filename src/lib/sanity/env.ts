/**
 * Plain config constants, deliberately free of side effects.
 *
 * Kept separate from client.ts so importing the image helpers doesn't
 * construct a Sanity client — which would otherwise make anything that touches
 * an image unusable in tests, and would drag the client into bundles that only
 * need to build a URL.
 */
/**
 * Checked rather than asserted with `!`. A bare `!` promises the compiler a
 * value that nothing actually verifies, so a fresh clone with no `.env.local`
 * fails later with a broken CDN URL instead of here, with a fixable message.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Locally: copy .env.local.example to .env.local and ` +
        `fill it in. On Vercel: Project → Settings → Environment Variables.`,
    );
  }
  return value;
}

export const projectId = requireEnv(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/**
 * Pinned so Sanity API changes can't silently alter query results. Must match
 * sanity.config.ts and sanity/assetSources/resizeUploadAssetSource.tsx.
 */
export const apiVersion = process.env.SANITY_API_VERSION || "2024-01-01";

/*
process.env is a global variable in the environment the project is running
 ! suffix mean it promise there's a value in there, could be dangerous once it's copied to another repo

 */
