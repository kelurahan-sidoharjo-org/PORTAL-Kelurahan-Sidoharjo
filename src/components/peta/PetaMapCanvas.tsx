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

/** Lama menunggu setelah ketukan terakhir sebelum kamera bergerak —
 * kamera yang bergerak tiap ketukan terasa gugup, bukan responsif. */
const CAMERA_DEBOUNCE_MS = 300;

/**
 * `pointer`, bukan `any-pointer`: laptop layar sentuh yang dipakai mouse
 * tetap punya `fine` sebagai pointer utamanya, jadi tetap klik-sekali-buka
 * ala desktop. Module ini cuma dimuat client-side (`ssr: false`), jadi
 * `window` selalu tersedia.
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

// Dibangun sekali di module scope, bukan per render — divIcon() melakukan
// pekerjaan nyata tiap dipanggil.
const markerIcons = Object.fromEntries(
  MARKER_CATEGORIES.map((category) => [category, markerIcon(category)]),
) as Record<MarkerCategory, ReturnType<typeof divIcon>>;

interface OverlayLayer {
  name: string;
  data: FeatureCollection;
  style: { color: string; fillColor?: string; fillOpacity?: number; weight: number };
}

/**
 * File yang dihasilkan staf lewat langkah QGIS di rencana proyek. Tiap
 * file diminta independen dan yang belum ada dilewati diam-diam.
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

/** Handler Leaflet untuk gerak/zoom manual, dikunci-lepas sebagai satu
 * kesatuan — lihat `CameraController`. Tidak termasuk `tap` (workaround
 * mobile Safari, tidak terkait pergerakan). */
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
  // Tombol +/- zoom memanggil map.zoomIn()/zoomOut() langsung, tidak
  // tersentuh handler di atas — jadi dilepas terpisah lewat remove()/addTo().
  if (interactive) map.zoomControl.addTo(map);
  else map.zoomControl.remove();
}

/** Menyesuaikan peta begitu data tersedia, dan lagi tiap kali pencarian
 * yang di-debounce berubah. Dipisah dari komponen utama karena `useMap`
 * cuma bekerja di dalam `MapContainer`.
 *
 * Satu effect, bukan dua: `homeBounds`/`searchBounds` harus sudah
 * di-memoize pemanggilnya, atau ini menyesuaikan ulang tiap render —
 * termasuk tiap ketukan tuts selama batas wilayah belum termuat. Bug yang
 * dulu ada di komponen ini.
 *
 * Juga mengunci pan/zoom sampai penyesuaian pertama selesai — tanpa itu,
 * pengunjung yang menggerakkan peta saat loading langsung dibatalkan
 * begitu homeBounds resolve. `overlaysReady` tetap membuka kunci walau
 * tidak ada yang perlu disesuaikan, supaya peta tidak membeku selamanya. */
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

/** Mengetuk area terbuka membatalkan pin yang "armed" (lihat
 * `armedPinRef`) tanpa harus mengenainya lagi. Ketukan marker tidak
 * pernah sampai sini — layer marker Leaflet tidak meneruskan klik ke peta. */
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

  // Pin yang sedang "armed" di perangkat touch: ketukan pertama membuka
  // tooltip, ketukan kedua di pin sama membuka Google Maps. Ref, bukan
  // state — tidak pernah perlu memicu render.
  const armedPinRef = useRef<string | null>(null);

  // Tiap overlay diambil independen, kegagalannya ditelan — layer yang
  // belum dibuat staf tidak boleh menghalangi layer lain atau pin dirender.
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

  // Kamera mengikuti query yang di-debounce, pin bereaksi ke `query`
  // langsung — jadi menyembunyikan pin selalu terasa instan.
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
        // react-leaflet menurunkan ini identik saat merender layer;
        // dihitung di sini juga supaya kamera bisa menyesuaikan lebih dulu.
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

  // Di-memoize: boundsOf() mengembalikan array baru tiap dipanggil, dan
  // effect CameraController mengunci identitasnya. Tanpa ini kamera
  // menyesuaikan ulang tiap render.
  //
  // Baru berarti setelah fetch overlay selesai — sebelum itu `overlays`
  // null dan homeBounds tetap null.
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
        // zoomSnap bawaan 1 membulatkan fitBounds() ke level zoom bulat,
        // yang berjarak 2x. Batas wilayah di sini ingin zoom ~15.4, jadi
        // dulu digambar di 15 dan cuma mengisi tiga perempat canvas.
        // Langkah seperempat mengikuti kontainer cukup dekat. Bukan 0:
        // zoom pecahan membuat tile Esri sedikit lembek, tapi itu trade-off
        // yang layak diambil.
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
                // Desktop: hover sudah menampilkan tooltip, satu klik ke
                // Google Maps. Touch tidak punya hover — ketukan pertama
                // meng-arm pin dan menampilkan tooltip; ketukan kedua
                // (pin sama) membuka tautannya.
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

/** Tiap koordinat di FeatureCollection, diratakan jadi [lat, lng] — cukup
 * untuk latLngBounds() menghitung extent, apa pun geometrinya. */
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
