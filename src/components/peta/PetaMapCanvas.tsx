"use client";

import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import type { LatLngBounds, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { toFeatureCollection } from "@/lib/geojson";
import {
  boundsOf,
  categoryLabel,
  countByCategory,
  filterPins,
  MARKER_CATEGORIES,
  PLACE_CATEGORY_MARKERS,
  presentCategories,
  SIDOHARJO_CENTER,
  toMapPins,
  type Bounds,
  type MapPin,
  type MarkerCategory,
} from "@/lib/places";
import type { Place, Umkm } from "@/lib/sanity/types";

/** How long to wait after the last keystroke before moving the camera — see
 * BeritaSearch, which uses the same value for the same reason: a camera that
 * moves on every keystroke reads as jittery, not responsive. */
const CAMERA_DEBOUNCE_MS = 300;

/**
 * `pointer`, not `any-pointer`: a touch-screen laptop driven with a mouse
 * still has `fine` as its *primary* pointer, so it keeps the desktop
 * one-click-opens behaviour. This module only loads client-side — PetaMap.tsx
 * imports it with `ssr: false` — so `window` is always available here.
 */
const isCoarsePointer =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function markerIcon(category: MarkerCategory) {
  const { emoji, color } = PLACE_CATEGORY_MARKERS[category];
  return divIcon({
    className: "peta-marker",
    html: `<span style="background:${color}"><i>${emoji}</i></span>`,
    iconAnchor: [18, 42],
    iconSize: [36, 42],
  });
}

// Built once at module scope, not per render — there are only thirteen
// categories plus umkm, and divIcon() does real work constructing each.
const markerIcons = Object.fromEntries(
  MARKER_CATEGORIES.map((category) => [category, markerIcon(category)]),
) as Record<MarkerCategory, ReturnType<typeof divIcon>>;

interface OverlayLayer {
  name: string;
  data: FeatureCollection;
  style: { color: string; fillColor?: string; fillOpacity?: number; weight: number };
}

/**
 * Files staff produce by following the QGIS steps in the project plan. Each is
 * requested independently and a missing one is silently skipped — the map
 * must still work with zero, one, or all three present.
 */
const OVERLAY_SOURCES = [
  {
    url: "/geojson/batas-kelurahan.geojson",
    name: "Batas Kelurahan",
    style: { color: "#facc15", fillColor: "#facc15", fillOpacity: 0.08, weight: 3 },
  },
  {
    url: "/geojson/jalan.geojson",
    name: "Jalan",
    style: { color: "#ffffff", weight: 2 },
  },
  {
    url: "/geojson/sungai.geojson",
    name: "Sungai",
    style: { color: "#38bdf8", weight: 3 },
  },
];

/** Every Leaflet handler a visitor could use to move or zoom the map by
 * hand, locked and released as one unit — see `CameraController`. Excludes
 * `tap` (mobile Safari's synthetic-click workaround, unrelated to movement). */
const INTERACTIVE_HANDLERS = [
  "dragging",
  "scrollWheelZoom",
  "doubleClickZoom",
  "touchZoom",
  "boxZoom",
  "keyboard",
] as const;

function setMapInteractive(map: LeafletMap, interactive: boolean) {
  for (const name of INTERACTIVE_HANDLERS) {
    if (interactive) map[name].enable();
    else map[name].disable();
  }
  // The zoom control's +/- buttons call map.zoomIn()/zoomOut() directly, so
  // disabling the handlers above doesn't touch them — they have to be pulled
  // off the map separately, hence remove()/addTo() rather than a handler.
  if (interactive) map.zoomControl.addTo(map);
  else map.zoomControl.remove();
}

/** Fits the map once real data is available, and again whenever the debounced
 * search narrows or clears. Split out from the main component because
 * react-leaflet's `useMap` only works inside a `MapContainer`.
 *
 * One effect, not two: `homeBounds`/`searchBounds` must already be memoized by
 * the caller (identity-stable across renders that don't actually change the
 * data), or this refits on every render instead of only when the target
 * changes — the bug this component used to have.
 *
 * Also locks every pan/zoom handler until that first fit lands. Without the
 * lock, a visitor who moves the map during the half-second the boundary file
 * takes to load gets overridden the instant homeBounds resolves — the map
 * visibly fights back. `overlaysReady` unlocks it anyway once the load
 * attempt has finished even with nothing to fit (an empty dataset), so the
 * map can't freeze permanently waiting for a fit that will never come. */
function CameraController({
  homeBounds,
  searchBounds,
  overlaysReady,
}: {
  homeBounds: Bounds | null;
  searchBounds: Bounds | null;
  overlaysReady: boolean;
}) {
  const map = useMap();
  const unlocked = useRef(false);

  useEffect(() => {
    setMapInteractive(map, false);
  }, [map]);

  useEffect(() => {
    const target = searchBounds ?? homeBounds;
    if (target) map.fitBounds(target, { padding: [32, 32], maxZoom: 17 });

    if (!unlocked.current && (target || overlaysReady)) {
      unlocked.current = true;
      setMapInteractive(map, true);
    }
  }, [map, homeBounds, searchBounds, overlaysReady]);

  return null;
}

/** Tapping open water lets a touch user back out of an armed pin (see
 * `armedPinRef` below) without having to hit that exact pin again. Marker taps
 * never reach this: Leaflet's marker layer doesn't bubble its click to the
 * map. */
function MapClickReset({ onReset }: { onReset: () => void }) {
  useMapEvents({ click: onReset });
  return null;
}

function Legend({
  pins,
  hidden,
  onToggle,
}: {
  pins: MapPin[];
  hidden: Set<MarkerCategory>;
  onToggle: (category: MarkerCategory) => void;
}) {
  const [open, setOpen] = useState(true);
  const categories = useMemo(() => presentCategories(pins), [pins]);
  const counts = useMemo(() => countByCategory(pins), [pins]);

  return (
    <div className="peta-legend" data-open={open}>
      <button
        type="button"
        className="peta-legend-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Tutup legenda" : "Buka legenda"}
      >
        <span>{open ? "✕" : "☰"}</span>
        <span className="peta-legend-toggle-label">Keterangan</span>
      </button>

      {open && (
        <div className="peta-legend-body">
          {categories.map((category) => {
            const { emoji, color } = PLACE_CATEGORY_MARKERS[category];
            const isHidden = hidden.has(category);
            return (
              <button
                key={category}
                type="button"
                className="peta-legend-item"
                data-off={isHidden}
                onClick={() => onToggle(category)}
                title={
                  isHidden
                    ? `Tampilkan ${categoryLabel(category)}`
                    : `Sembunyikan ${categoryLabel(category)}`
                }
              >
                <span className="peta-legend-swatch" style={{ background: color }}>
                  {emoji}
                </span>
                <span className="peta-legend-label">
                  {categoryLabel(category)}
                  <span className="peta-legend-count">{counts.get(category)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PetaMapCanvas({
  places,
  umkm,
  query,
}: {
  places: Place[];
  umkm: Umkm[];
  query: string;
}) {
  const [overlays, setOverlays] = useState<OverlayLayer[] | null>(null);
  const [hidden, setHidden] = useState<Set<MarkerCategory>>(new Set());
  const [cameraQuery, setCameraQuery] = useState("");

  // Which pin is "armed" on a touch device: the first tap opens its tooltip,
  // a second tap on that same pin opens Google Maps. A ref, not state — this
  // never needs to cause a render, so there's no reason to make it one.
  const armedPinRef = useRef<string | null>(null);

  // Each overlay is fetched independently and failures are swallowed — a
  // layer staff haven't produced yet (see the QGIS steps in the plan) must not
  // block the other two, or the pins, from rendering.
  useEffect(() => {
    let cancelled = false;

    Promise.all(
      OVERLAY_SOURCES.map(async (source) => {
        try {
          const response = await fetch(source.url);
          if (!response.ok) return null;
          const data = toFeatureCollection(await response.json());
          return { name: source.name, data, style: source.style };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!cancelled) setOverlays(results.filter((layer) => layer !== null));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // The camera follows a debounced copy of the query — see CAMERA_DEBOUNCE_MS
  // — while pins below react to `query` directly, so hiding a pin always feels
  // instant even though the map settles a beat later.
  useEffect(() => {
    const timer = setTimeout(() => setCameraQuery(query), CAMERA_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const allPins = useMemo(() => toMapPins(places, umkm), [places, umkm]);
  const visiblePins = useMemo(
    () => filterPins(allPins, { query, hidden }),
    [allPins, query, hidden],
  );
  const cameraPins = useMemo(
    () => filterPins(allPins, { query: cameraQuery, hidden }),
    [allPins, cameraQuery, hidden],
  );

  const geoBounds = useMemo<Bounds | null>(() => {
    if (!overlays || overlays.length === 0) return null;
    let combined: LatLngBounds | null = null;
    for (const layer of overlays) {
      const layerBounds = latLngBounds(
        // react-leaflet re-derives this identically when it renders the layer;
        // computing it here too is what lets the camera fit *before* the user
        // has to wait for that render.
        geoJsonCoordinatesToLatLngs(layer.data),
      );
      if (!layerBounds.isValid()) continue;
      combined = combined ? combined.extend(layerBounds) : layerBounds;
    }
    if (!combined || !combined.isValid()) return null;
    const sw = combined.getSouthWest();
    const ne = combined.getNorthEast();
    return [
      [sw.lat, sw.lng],
      [ne.lat, ne.lng],
    ];
  }, [overlays]);

  // Memoized, not recomputed inline: boundsOf() returns a fresh array every
  // call, and CameraController's effect keys off these by identity. Without
  // useMemo here, the camera would refit on every render — including every
  // keystroke whenever the boundary file (which stabilises geoBounds) is
  // missing — rather than only when the target actually changes.
  //
  // Only meaningful once the overlay fetches have settled (see the effect
  // above) — before that, `overlays` is null and homeBounds stays null.
  const homeBounds = useMemo<Bounds | null>(
    () => (overlays === null ? null : (geoBounds ?? boundsOf(allPins))),
    [overlays, geoBounds, allPins],
  );

  const searchBounds = useMemo<Bounds | null>(
    () => (cameraQuery.trim() ? boundsOf(cameraPins) : null),
    [cameraQuery, cameraPins],
  );

  function toggleCategory(category: MarkerCategory) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="peta-map-wrapper">
      <MapContainer
        center={SIDOHARJO_CENTER}
        zoom={14}
        minZoom={1}
        // Leaflet's default zoomSnap of 1 rounds every fitBounds() down to a
        // whole zoom level, and whole levels are 2x apart. The kelurahan
        // boundary wants zoom ~15.4 here, so it was being drawn at 15 and
        // filling only about three quarters of the canvas height — and any
        // change to the canvas smaller than a full level (which is nearly all
        // of them) produced no visible refit at all. Quarter steps track the
        // container closely enough to look fitted. Not 0: a fractional zoom
        // scales the Esri raster tiles, and the softness that causes is worth
        // trading a few percent of slack to keep small.
        zoomSnap={0.25}
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          attribution="&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <CameraController
          homeBounds={homeBounds}
          searchBounds={searchBounds}
          overlaysReady={overlays !== null}
        />
        <MapClickReset onReset={() => (armedPinRef.current = null)} />

        {overlays?.map((layer) => (
          <GeoJSON key={layer.name} data={layer.data} style={layer.style} />
        ))}

        {visiblePins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.location.lat, pin.location.lng]}
            icon={markerIcons[pin.category]}
            alt={pin.name}
            eventHandlers={{
              click: (event) => {
                // Desktop: hover already showed the tooltip, so one click can
                // go straight to Google Maps. Touch has no hover — a tap that
                // opens a new tab immediately means the visitor never learns
                // which pin they hit. First tap arms this pin and shows its
                // tooltip; the second (on the same pin) opens the link.
                if (!isCoarsePointer || armedPinRef.current === pin.id) {
                  window.open(pin.googleMapsUrl, "_blank", "noopener,noreferrer");
                  return;
                }
                armedPinRef.current = pin.id;
                event.target.openTooltip();
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -36]}>
              <strong>
                {PLACE_CATEGORY_MARKERS[pin.category].emoji} {pin.name}
              </strong>
              <br />
              <span style={{ opacity: 0.7, fontSize: "0.85em" }}>
                {categoryLabel(pin.category)}
              </span>
              {isCoarsePointer && (
                <>
                  <br />
                  <span style={{ opacity: 0.6, fontSize: "0.78em" }}>
                    Ketuk lagi untuk buka Google Maps
                  </span>
                </>
              )}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      <Legend pins={allPins} hidden={hidden} onToggle={toggleCategory} />
    </div>
  );
}

/** Every coordinate in a FeatureCollection, flattened to [lat, lng] pairs —
 * enough for latLngBounds() to compute an extent from, regardless of whether
 * the geometry underneath is a Polygon, LineString or MultiLineString. */
function geoJsonCoordinatesToLatLngs(collection: FeatureCollection): [number, number][] {
  const points: [number, number][] = [];

  function walk(coords: unknown): void {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push([coords[1] as number, coords[0] as number]);
      return;
    }
    for (const item of coords) walk(item);
  }

  for (const feature of collection.features) {
    if (feature.geometry && "coordinates" in feature.geometry) {
      walk(feature.geometry.coordinates);
    }
  }

  return points;
}
