import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * File overlay di public/geojson/ datang dalam dua bentuk.
 *
 * Ekspor QGIS adalah FeatureCollection GeoJSON sungguhan. Tapi data GIS
 * juga beredar sebagai **Esri JSON** — koordinat sama, key beda:
 * `geometry.rings`/`paths`, `attributes` bukan `properties`. Proyek acuan
 * peta ini mengirim file Esri.
 *
 * Leaflet cuma paham GeoJSON asli dan gagal diam-diam pada yang lain —
 * tidak ada error, cuma tidak tergambar. Jadi bentuknya dideteksi.
 */

interface EsriFeature {
  attributes?: Record<string, unknown>;
  geometry?: { paths?: number[][][]; rings?: number[][][] };
}

interface EsriFeatureSet {
  features?: EsriFeature[];
}

function isFeatureCollection(data: unknown): data is FeatureCollection {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "FeatureCollection"
  );
}

/**
 * Menormalkan kedua bentuk itu menjadi satu FeatureCollection GeoJSON.
 * GeoJSON asli diteruskan apa adanya; Esri JSON dikonversi.
 *
 * Array `rings` adalah sebuah Polygon (ring pertama luar, sisanya lubang).
 * `paths` menjadi LineString kalau cuma ada satu path dan MultiLineString
 * kalau ada beberapa — menyederhanakannya jadi LineString saja akan diam-
 * diam membuang tiap cabang sungai atau jalan setelah yang pertama.
 */
export function toFeatureCollection(data: unknown): FeatureCollection {
  if (isFeatureCollection(data)) return data;

  const features: Feature[] = [];

  for (const { attributes = {}, geometry } of (data as EsriFeatureSet)
    ?.features ?? []) {
    let shape: Geometry | null = null;

    if (geometry?.rings?.length) {
      shape = { type: "Polygon", coordinates: geometry.rings };
    } else if (geometry?.paths?.length) {
      shape =
        geometry.paths.length === 1
          ? { type: "LineString", coordinates: geometry.paths[0] }
          : { type: "MultiLineString", coordinates: geometry.paths };
    }

    if (shape) {
      features.push({ type: "Feature", properties: attributes, geometry: shape });
    }
  }

  return { type: "FeatureCollection", features };
}
