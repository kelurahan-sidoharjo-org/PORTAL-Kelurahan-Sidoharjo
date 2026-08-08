import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Overlay files in public/geojson/ arrive in one of two shapes, and the page
 * has to accept both.
 *
 * A QGIS "Save Features As… → GeoJSON" export is a real GeoJSON
 * FeatureCollection. But GIS data also circulates as **Esri JSON**, which
 * looks similar and carries the same coordinates under different keys —
 * `geometry.rings` for areas, `geometry.paths` for lines, and `attributes`
 * instead of `properties`. The reference project this map is modelled on
 * (patik-map-website) ships Esri files.
 *
 * Leaflet only understands real GeoJSON, and it fails *quietly* on the other:
 * no error, just nothing drawn. So the format is detected rather than assumed.
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
 * Normalises either shape into a GeoJSON FeatureCollection. Real GeoJSON is
 * passed through untouched; Esri JSON is converted.
 *
 * A `rings` array is a Polygon (first ring outer, the rest holes). `paths` is
 * a LineString when there's one path and a MultiLineString when there are
 * several — collapsing that to LineString would silently drop every branch of
 * a river or road after the first.
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
