/**
 * The two base layers offered on both maps — the public /peta and the Studio
 * location picker.
 *
 * Satellite alone turns out to be a poor surface for *placing* a pin: it shows
 * roofs and trees but no roads or names, so there's nothing to orient by in a
 * village where one tin roof looks much like the next. The street map answers
 * "which road is this"; the imagery answers "which building is this". Two
 * plain layers, switchable — no blended hybrid, for the reasons below.
 *
 * Both sources are free, keyless and anonymous, which is the constraint the
 * whole map stack is built around — see CLAUDE.md Phase 3.
 *
 * Lives in sanity/ rather than src/lib/ because sanity/ is built without the
 * `@/` alias, and the public map can reach *down* into this path while the
 * Studio input cannot reach up.
 */

export const ESRI_ATTRIBUTION =
  "&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Note the {z}/{y}/{x} order: ArcGIS puts y before x, unlike the {z}/{x}/{y}
 * that OSM and most other providers use. Swapping them yields a map that
 * renders fine but shows the wrong part of the world.
 */
export const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/**
 * OpenStreetMap's standard style. Sidoharjo is well mapped in OSM — roads,
 * buildings and many road names — and because it's a normal opaque basemap the
 * labels render at full contrast with no tricks.
 *
 * OSM's tile usage policy asks that heavy traffic use a commercial mirror. A
 * kelurahan portal and a handful of Studio editors sit far below that.
 */
export const STREETS_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAX_ZOOM = 19;

/**
 * ── Why there is no "satellite + street names" hybrid ─────────────────────
 *
 * Three approaches were built and rejected. Measured over 24 tiles covering
 * the kelurahan, 2026-08-06:
 *
 *   Transparent label overlays are empty here. Esri's
 *   Reference/World_Transportation and Reference/World_Boundaries_and_Places
 *   both returned 0/24 tiles with content — blank 872 B PNGs. CARTO's
 *   *_only_labels managed 8/24 at z16 and 0/24 at z18. Nothing to overlay.
 *
 *   multiply + standard OSM renders labels in their original near-black,
 *   which disappears against dark imagery.
 *
 *   screen or lighten + CARTO's dark basemap gets the labels light, but a
 *   blended layer is translucent by definition: the text never reads as solid,
 *   and pushing contrast to compensate makes the roads overbearing before the
 *   names become comfortable.
 *
 * Inverting OSM is not a fourth option — its residential roads are filled
 * white, so inverting turns them black and the blend then drops them.
 *
 * Don't re-attempt a hybrid without re-running that tile measurement; every
 * approach above looks reasonable on paper and fails only once rendered.
 */

/** Indonesian names for the layer switcher — editors and visitors are the
 * audience, so these are never shown in English. */
export const LAYER_LABELS = {
  satellite: "Satelit",
  streets: "Peta Jalan",
} as const;
