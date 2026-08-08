/**
 * Turns whatever a staff member pastes into the "Titik Lokasi" box into a
 * coordinate pair, or null if it can't be read.
 *
 * Lives beside locationInput.tsx rather than in src/lib/ because sanity/ is
 * built without the `@/` alias — keeping it local avoids wiring one up for a
 * single import.
 *
 * Deliberately returns null rather than guessing. A parser that quietly
 * produces a *nearly* right coordinate is worse than one that refuses, because
 * a pin 40 km off looks just as plausible as a correct one to whoever pasted
 * it — the caller shows an error instead.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Google Maps encodes the same point several ways, and staff will paste
 * whichever their screen produced. Ordered by trustworthiness:
 *
 * 1. `!3d<lat>!4d<lng>` inside a /place/ URL's `data=` blob — the actual pin.
 * 2. `?q=<lat>,<lng>` — an explicit coordinate query.
 * 3. `@<lat>,<lng>,<zoom>z` — the *viewport centre*, which is only near the
 *    pin. Last resort precisely because it's the one that can be off.
 *
 * Not handled: `maps.app.goo.gl` short links, which contain no coordinates at
 * all and would need a network request to resolve. They fall through to null.
 */
const URL_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&]q=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
];

/** A bare pair: "-7.8179, 111.0704", "-7.8179,111.0704", "-7.8179 111.0704".
 * Anchored so trailing junk is rejected rather than half-read. */
const PAIR = /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/;

function valid(lat: number, lng: number): Coordinates | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Also the swap guard: a transposed pair for Indonesia puts longitude
  // (~111) in the latitude slot, which is out of range and caught here.
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseCoordinates(input: string): Coordinates | null {
  const text = input.trim();
  if (!text) return null;

  const pair = PAIR.exec(text);
  if (pair) return valid(Number(pair[1]), Number(pair[2]));

  for (const pattern of URL_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const found = valid(Number(match[1]), Number(match[2]));
      if (found) return found;
    }
  }

  return null;
}
