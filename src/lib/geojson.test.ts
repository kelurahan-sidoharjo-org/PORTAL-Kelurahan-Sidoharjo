import { describe, expect, it } from "vitest";
import { toFeatureCollection } from "./geojson";

describe("toFeatureCollection", () => {
  it("passes a real GeoJSON FeatureCollection through unchanged", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Batas Kelurahan" },
          geometry: { type: "Polygon", coordinates: [[[111, -7], [111.1, -7], [111, -7]]] },
        },
      ],
    };
    expect(toFeatureCollection(geojson)).toBe(geojson);
  });

  it("converts Esri rings to a Polygon", () => {
    const esri = {
      features: [
        {
          attributes: { Nama: "Batas Kelurahan" },
          geometry: { rings: [[[111, -7], [111.1, -7], [111, -7.1], [111, -7]]] },
        },
      ],
    };
    const result = toFeatureCollection(esri);
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(1);
    expect(result.features[0]).toMatchObject({
      type: "Feature",
      properties: { Nama: "Batas Kelurahan" },
      geometry: {
        type: "Polygon",
        coordinates: [[[111, -7], [111.1, -7], [111, -7.1], [111, -7]]],
      },
    });
  });

  it("converts a single Esri path to a LineString", () => {
    const esri = {
      features: [{ geometry: { paths: [[[111, -7], [111.1, -7.1]]] } }],
    };
    const result = toFeatureCollection(esri);
    expect(result.features[0].geometry).toEqual({
      type: "LineString",
      coordinates: [[111, -7], [111.1, -7.1]],
    });
  });

  it("converts multiple Esri paths to a MultiLineString", () => {
    const esri = {
      features: [
        {
          geometry: {
            paths: [
              [[111, -7], [111.1, -7.1]],
              [[112, -8], [112.1, -8.1]],
            ],
          },
        },
      ],
    };
    const result = toFeatureCollection(esri);
    expect(result.features[0].geometry).toEqual({
      type: "MultiLineString",
      coordinates: [
        [[111, -7], [111.1, -7.1]],
        [[112, -8], [112.1, -8.1]],
      ],
    });
  });

  it("skips Esri features with no usable geometry and drops empty attributes", () => {
    const esri = { features: [{ geometry: {} }, { attributes: {} }] };
    expect(toFeatureCollection(esri).features).toEqual([]);
  });

  it("returns an empty collection for an empty Esri feature set", () => {
    expect(toFeatureCollection({ features: [] })).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });
});
