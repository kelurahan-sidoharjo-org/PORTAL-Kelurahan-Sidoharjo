import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { set, unset } from "sanity";
import type { ObjectInputProps } from "sanity";
import type { LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";
import { parseCoordinates } from "./parseCoordinates";
import {
  ESRI_ATTRIBUTION,
  LAYER_LABELS,
  MAX_ZOOM,
  OSM_ATTRIBUTION,
  SATELLITE_URL,
  STREETS_URL,
} from "./basemaps";

/**
 * The "Titik Lokasi" field on `place` and `umkm`.
 *
 * Sanity's stock geopoint input is two number boxes — usable for a developer,
 * hostile to the staff this Studio is built for: a mistyped digit drops the pin
 * in the sea with no feedback. This renders a small map instead: search by
 * name, then drag the pin until it sits on the right roof.
 *
 * No API key anywhere. Tiles come from OpenStreetMap and Esri (the same two
 * layers as /peta) and search from Nominatim, so this adds nothing to the
 * handover. The two plugins that
 * would have done this are both dead ends — sanity-plugin-leaflet-input stopped
 * at Sanity v2 (2022), and @sanity/google-maps-input drags back the Google
 * Cloud billing account this project deliberately avoids.
 */

/** Centre of Kelurahan Sidoharjo — where the map opens before a pin exists.
 * Duplicated from SIDOHARJO_CENTER in src/lib/places.ts on purpose: sanity/ is
 * a separate build with no `@/` alias, and one constant is cheaper than wiring
 * one up. Keep the two in step. */
const FALLBACK_CENTER: [number, number] = [-7.8173, 111.0708];

/** Nominatim asks for at most one request per second. Typing is debounced well
 * past that; the limit is never the binding constraint at Studio speed. */
const SEARCH_DEBOUNCE_MS = 600;

/**
 * Leaflet's default marker relies on image files (marker-icon.png etc.)
 * resolved relative to its own CSS — a path that breaks under Next's webpack
 * bundling and renders as a broken image with no error. A tiny inline
 * divIcon sidesteps that entirely; PetaMapCanvas on the public site takes the
 * same approach for the same reason.
 */
function pinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html:
      '<span style="display:block;width:20px;height:20px;border-radius:50% 50% 50% 0;' +
      'background:#2c694e;border:3px solid white;box-shadow:0 2px 8px rgb(0 0 0 / 35%);' +
      'transform:rotate(-45deg)"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

interface GeoPointValue {
  _type?: "geopoint";
  lat?: number;
  lng?: number;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationInput(props: ObjectInputProps<GeoPointValue>) {
  const { value, onChange, readOnly } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const lat = typeof value?.lat === "number" ? value.lat : null;
  const lng = typeof value?.lng === "number" ? value.lng : null;
  const hasPoint = lat !== null && lng !== null;

  /**
   * Held in a ref and read inside Leaflet's handlers, so the map is built once
   * on mount instead of being torn down and rebuilt whenever `onChange`'s
   * identity changes — which would drop the user's pan and zoom mid-edit.
   */
  const commit = useRef(onChange);
  useEffect(() => {
    commit.current = onChange;
  });

  const setPoint = useCallback((next: { lat: number; lng: number }) => {
    commit.current(
      set({
        _type: "geopoint",
        // Six decimals is ~10 cm. Storing Leaflet's full float precision would
        // write a dozen meaningless digits into every document.
        lat: Number(next.lat.toFixed(6)),
        lng: Number(next.lng.toFixed(6)),
      }),
    );
  }, []);

  // Build the map once. Leaflet is imported dynamically because Studio renders
  // on the server during `next build`, and Leaflet touches `window` at import.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: hasPoint ? [lat, lng] : FALLBACK_CENTER,
        zoom: hasPoint ? 17 : 14,
        // Scroll-zoom is off on purpose: the field sits in a scrolling form, and
        // a wheel that zooms the map instead of scrolling the page traps the
        // editor. Buttons and pinch still zoom.
        scrollWheelZoom: false,
      });

      /*
       * Two base layers. Street map is the default here (unlike the public
       * map, which opens on satellite): the job in this field is to work out
       * *where* a place is, and named roads answer that far faster than
       * imagery. Switch to Satelit once you're on the right street and need
       * the exact building.
       */
      const streets = L.tileLayer(STREETS_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: MAX_ZOOM,
      });
      const satellite = L.tileLayer(SATELLITE_URL, {
        attribution: ESRI_ATTRIBUTION,
        maxZoom: MAX_ZOOM,
      });

      streets.addTo(map);
      L.control
        .layers(
          {
            [LAYER_LABELS.streets]: streets,
            [LAYER_LABELS.satellite]: satellite,
          },
          undefined,
          { collapsed: true },
        )
        .addTo(map);

      /*
       * The kelurahan boundary, purely as a reference: it tells the editor at a
       * glance whether the pin they just dropped is even inside Sidoharjo.
       * Fetched the same way the public map does it, and skipped silently if
       * the file isn't there yet.
       */
      void fetch("/geojson/batas-kelurahan.geojson")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data || cancelled || !mapRef.current) return;
          L.geoJSON(data, {
            style: { color: "#facc15", weight: 2, fill: false },
            interactive: false,
          }).addTo(mapRef.current);
        })
        .catch(() => {
          /* no boundary file yet — the picker works fine without it */
        });

      if (hasPoint) {
        markerRef.current = L.marker([lat, lng], {
          draggable: !readOnly,
          icon: pinIcon(L),
        }).addTo(map);
        markerRef.current.on("dragend", () => {
          const position = markerRef.current?.getLatLng();
          if (position) setPoint(position);
        });
      }

      map.on("click", (event: LeafletMouseEvent) => {
        if (readOnly) return;
        setPoint(event.latlng);
      });

      mapRef.current = map;

      // The field often mounts inside a collapsed section or a tab, where the
      // container has no height yet. Leaflet caches the size it saw at init and
      // would render a sliver of tiles forever; this re-measures once laid out.
      requestAnimationFrame(() => map.invalidateSize());
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Deliberately mount-only: `lat`/`lng` seed the opening view, and the effect
    // below is what keeps the marker in step afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in step with the value, whichever way it changed — a click,
  // a drag, a search result, the Clear button, or an undo from Sanity's history.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasPoint) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    void import("leaflet").then((L) => {
      const current = mapRef.current;
      if (!current) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: !readOnly,
          icon: pinIcon(L),
        }).addTo(current);
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          if (position) setPoint(position);
        });
        markerRef.current = marker;
      }
    });
  }, [hasPoint, lat, lng, readOnly, setPoint]);

  // Search-as-you-type against Nominatim, biased to Indonesia so "Balai Desa"
  // doesn't return a match in another hemisphere. The short-query case is
  // handled in the input's onChange below, not here — synchronously clearing
  // state at the top of an effect body is a footgun the effect itself should
  // never need, and here it doesn't: the event that shrinks the query already
  // knows to clear the stale results.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError(null);

      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=id&q=${encodeURIComponent(text)}`,
        { signal: controller.signal, headers: { Accept: "application/json" } },
      )
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json() as Promise<SearchResult[]>;
        })
        .then(setResults)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setResults([]);
          setSearchError("Pencarian gagal. Periksa koneksi, atau geser pin manual.");
        })
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = useCallback(
    (result: SearchResult) => {
      const next = { lat: Number(result.lat), lng: Number(result.lon) };
      setPoint(next);
      mapRef.current?.setView([next.lat, next.lng], 17);
      setResults([]);
      setQuery("");
    },
    [setPoint],
  );

  /**
   * The manual escape hatch: paste a coordinate pair (what Google Maps puts on
   * the clipboard when you right-click a spot and click the numbers) or a Maps
   * URL that carries one. Covers the case where searching by name finds
   * nothing and clicking the map is too fiddly to hit exactly.
   */
  const applyManual = useCallback(() => {
    const parsed = parseCoordinates(manual);
    if (!parsed) {
      setManualError(
        "Tidak terbaca. Contoh yang benar: -7.8179, 111.0704 (lintang dulu, baru bujur).",
      );
      return;
    }
    setPoint(parsed);
    mapRef.current?.setView([parsed.lat, parsed.lng], 17);
    setManual("");
    setManualError(null);
  }, [manual, setPoint]);

  const coordinateLabel = useMemo(
    () =>
      hasPoint
        ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        : "Belum ada titik — klik peta, cari nama tempat di atas, atau tempel koordinat di bawah.",
    [hasPoint, lat, lng],
  );

  return (
    <Stack space={3}>
      {!readOnly && (
        <Stack space={2}>
          <TextInput
            value={query}
            onChange={(event) => {
              const next = event.currentTarget.value;
              setQuery(next);
              // Below Nominatim's 3-character floor, no fetch will fire (see
              // the search effect) — so nothing else clears results left over
              // from a longer query the user just backspaced out of.
              if (next.trim().length < 3) {
                setResults([]);
                setSearchError(null);
              }
            }}
            placeholder="Cari nama tempat, misalnya: Kantor Kelurahan Sidoharjo"
          />
          {searching && (
            <Text size={1} muted>
              Mencari…
            </Text>
          )}
          {searchError && (
            <Text size={1} muted>
              {searchError}
            </Text>
          )}
          {results.length > 0 && (
            <Card border radius={2} padding={1}>
              <Stack space={1}>
                {results.map((result) => (
                  <Button
                    key={`${result.lat},${result.lon}`}
                    mode="bleed"
                    justify="flex-start"
                    padding={2}
                    fontSize={1}
                    text={result.display_name}
                    onClick={() => choose(result)}
                  />
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      )}

      <Card border radius={2} overflow="hidden">
        <Box
          ref={containerRef}
          style={{
            // Roomy enough to actually recognise a building and still drag the
            // pin without constantly re-panning. The old 280 made both fiddly.
            height: 400,
            // Studio's own overlays sit around z-index 100+; Leaflet's panes
            // start at 400 and would otherwise punch through dialogs.
            zIndex: 0,
            // A read-only form (published perspective, an old revision, a
            // release) must not accept edits, and Leaflet has no readOnly of
            // its own — the whole surface is made inert instead.
            pointerEvents: readOnly ? "none" : undefined,
            opacity: readOnly ? 0.6 : undefined,
          }}
        />
      </Card>

      <Flex align="center" gap={2}>
        <Text size={1} muted style={{ flex: 1 }}>
          {coordinateLabel}
        </Text>
        {hasPoint && !readOnly && (
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            text="Hapus titik"
            onClick={() => commit.current(unset())}
          />
        )}
      </Flex>

      {!readOnly && (
        <Stack space={2}>
          <Flex gap={2}>
            <Box flex={1}>
              <TextInput
                value={manual}
                onChange={(event) => {
                  setManual(event.currentTarget.value);
                  if (manualError) setManualError(null);
                }}
                // Enter would otherwise submit the surrounding Studio form.
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  applyManual();
                }}
                placeholder="Tempel koordinat: -7.8179, 111.0704"
              />
            </Box>
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              text="Terapkan"
              disabled={!manual.trim()}
              onClick={applyManual}
            />
          </Flex>

          <Text size={1} muted>
            {manualError ??
              "Di Google Maps: klik kanan pada lokasinya, lalu klik deretan angka yang muncul untuk menyalinnya. Tautan Google Maps yang memuat koordinat juga bisa ditempel di sini."}
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
