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
 * Field "Titik Lokasi" pada `place` dan `umkm`.
 *
 * Input geopoint bawaan Sanity berupa dua kotak angka — satu digit salah
 * ketik menjatuhkan pin ke tengah laut tanpa tanda apa pun. Ini merender
 * peta kecil sebagai gantinya: cari nama, lalu geser pin ke atap yang benar.
 *
 * Tanpa API key: tile dari OpenStreetMap dan Esri, pencarian dari
 * Nominatim. Dua plugin siap pakai sama-sama jalan buntu —
 * sanity-plugin-leaflet-input berhenti di Sanity v2 (2022), dan
 * @sanity/google-maps-input menyeret kembali billing Google Cloud yang
 * proyek ini sengaja hindari.
 */

/** Titik tengah Sidoharjo — tempat peta terbuka sebelum ada pin. Sengaja
 * diduplikasi dari SIDOHARJO_CENTER di src/lib/places.ts: sanity/ tidak
 * punya alias `@/`. Jaga keduanya tetap sama. */
const FALLBACK_CENTER: [number, number] = [-7.8173, 111.0708];

/** Nominatim meminta maksimal satu request per detik. Pengetikan sudah
 * di-debounce jauh melebihi itu; batas itu tidak pernah jadi kendala pada
 * kecepatan pemakaian Studio. */
const SEARCH_DEBOUNCE_MS = 600;

/**
 * Marker bawaan Leaflet bergantung pada file gambar yang path-nya rusak
 * kena bundling webpack Next — tampil sebagai gambar rusak tanpa error.
 * divIcon inline ini menghindarinya; PetaMapCanvas di situs publik
 * memakai trik yang sama.
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
   * Disimpan di ref dan dibaca di handler Leaflet, supaya peta dibangun
   * sekali saat mount, bukan dibongkar-pasang tiap `onChange` berubah
   * identitas — yang akan menghapus pan/zoom pengguna di tengah edit.
   */
  const commit = useRef(onChange);
  useEffect(() => {
    commit.current = onChange;
  });

  const setPoint = useCallback((next: { lat: number; lng: number }) => {
    commit.current(
      set({
        _type: "geopoint",
        // Enam desimal setara ~10 cm. Menyimpan presisi float penuh dari
        // Leaflet akan menulis belasan digit yang tidak berarti apa-apa ke
        // tiap dokumen.
        lat: Number(next.lat.toFixed(6)),
        lng: Number(next.lng.toFixed(6)),
      }),
    );
  }, []);

  // Bangun peta sekali saja. Leaflet diimpor dinamis karena Studio
  // dirender di server saat `next build`, dan Leaflet menyentuh `window` saat diimpor.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: hasPoint ? [lat, lng] : FALLBACK_CENTER,
        zoom: hasPoint ? 17 : 14,
        // Scroll-zoom sengaja dimatikan: field ini berada di dalam form
        // yang bisa di-scroll, dan wheel yang malah men-zoom peta alih-alih
        // men-scroll halaman akan menjebak si editor. Tombol dan pinch
        // tetap bisa untuk zoom.
        scrollWheelZoom: false,
      });

      /*
       * Dua basemap. Peta jalan jadi default (beda dari peta publik yang
       * buka di satelit): tugas field ini mencari *di mana*, dan nama
       * jalan menjawab itu lebih cepat dari citra satelit.
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
       * Batas wilayah, sebagai acuan: memberi tahu editor sekilas apakah
       * pin yang baru ditaruh benar-benar di dalam Sidoharjo. Dilewati
       * diam-diam kalau filenya belum ada.
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
          /* belum ada file batas — picker-nya tetap berfungsi tanpa itu */
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

      // Field ini sering ter-mount di section yang collapsed atau di tab
      // tanpa tinggi. Leaflet mengunci ukuran awal itu selamanya kalau
      // tidak diukur ulang begitu layout-nya selesai.
      requestAnimationFrame(() => map.invalidateSize());
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Sengaja hanya-saat-mount: `lat`/`lng` cuma mengisi tampilan awal;
    // effect di bawah yang menjaga marker sinkron sesudahnya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jaga marker tetap sinkron dengan value, apa pun sebabnya berubah — klik,
  // drag, hasil pencarian, tombol Hapus, atau undo dari riwayat Sanity.
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

  // Pencarian sambil mengetik ke Nominatim, dibiaskan ke Indonesia supaya
  // "Balai Desa" tidak mengembalikan hasil dari belahan bumi lain. Query
  // pendek ditangani di onChange input, bukan di sini — event yang
  // memperpendek query sudah tahu harus membersihkan hasil yang basi.
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
   * Jalan keluar manual: tempel koordinat (dari klik-kanan Google Maps →
   * klik angkanya) atau URL Maps yang membawanya. Untuk kasus pencarian
   * nama tidak ketemu dan mengklik peta terlalu sulit tepat sasaran.
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
              // Di bawah 3 karakter, effect pencarian tidak jalan — jadi
              // sisa hasil dari query lama harus dibersihkan di sini.
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
            // Cukup lega untuk mengenali bangunan sambil tetap bisa
            // menggeser pin. Nilai lama 280 membuat keduanya merepotkan.
            height: 400,
            // Overlay Studio ada di sekitar z-index 100+; pane Leaflet
            // mulai dari 400 dan bisa menembus dialog kalau tidak dijaga.
            zIndex: 0,
            // Leaflet tidak punya readOnly sendiri — permukaannya dibuat inert.
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
                // Kalau tidak, Enter akan mengirim form Studio di sekitarnya.
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
