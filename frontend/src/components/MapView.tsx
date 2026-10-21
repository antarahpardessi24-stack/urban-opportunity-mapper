
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import type { WardGeoJSON } from "../types/ward";

maplibregl.setWorkerUrl(workerUrl);

type MapMetric =
  | "opportunity_score"
  | "demand_score"
  | "supply_gap_score"
  | "accessibility_score";

interface MapViewProps {
  wards: WardGeoJSON;
  onWardClick?: (wardId: number) => void;
  mapMetric?: MapMetric;
}

const SOURCE_ID = "wards";
const FILL_LAYER_ID = "ward-fill";
const OUTLINE_LAYER_ID = "ward-outline";
const LABEL_LAYER_ID = "ward-labels";

function getMetricProperty(metric: MapMetric): string {
  switch (metric) {
    case "demand_score":
      return "demand_score";
    case "supply_gap_score":
      return "supply_gap_score";
    case "accessibility_score":
      return "accessibility_score";
    default:
      return "opportunity_score";
  }
}

function getMetricLabel(metric: MapMetric): string {
  switch (metric) {
    case "demand_score":
      return "Demand";
    case "supply_gap_score":
      return "Supply Gap";
    case "accessibility_score":
      return "Accessibility";
    default:
      return "Opportunity Score";
  }
}

export default function MapView({
  wards,
  onWardClick,
  mapMetric = "opportunity_score",
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onWardClickRef = useRef(onWardClick);
  const metricRef = useRef(mapMetric);
  const wardsRef = useRef(wards);

  useEffect(() => {
    onWardClickRef.current = onWardClick;
  }, [onWardClick]);

  useEffect(() => {
    metricRef.current = mapMetric;
  }, [mapMetric]);

  useEffect(() => {
    wardsRef.current = wards;
  }, [wards]);

  // Create the map once.
  useEffect(() => {
    const container = mapContainer.current;

    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              'Tiles &copy; Esri | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },
        layers: [
          {
            id: "esri-basemap",
            type: "raster",
            source: "esri",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [73.8567, 18.5204],
      zoom: 10,
      minZoom: 7,
      maxZoom: 18,
      attributionControl: {
        compact: true,
      },
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "top-right"
    );

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(container);

    map.on("error", (event) => {
      console.error("MapLibre runtime error:", event.error ?? event);
    });

    map.on("load", () => {
      if (mapRef.current !== map) return;

      map.resize();

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: wardsRef.current as GeoJSON.FeatureCollection,
        promoteId: "ward_id",
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": getColorExpression(metricRef.current),
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.82,
            0.65,
          ],
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#22D3EE",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            3,
            1.4,
          ],
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: LABEL_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 9,
        layout: {
          "text-field": [
            "concat",
            "Ward ",
            ["to-string", ["get", "ward_id"]],
          ],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            8,
            12,
            11,
            15,
            13,
          ],
          "text-font": ["Open Sans Regular"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-sort-key": ["to-number", ["get", "ward_id"]],
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#071018",
          "text-halo-width": 1.5,
        },
      });

      let hoveredWardId: number | null = null;

      map.on("mousemove", FILL_LAYER_ID, (event) => {
        map.getCanvas().style.cursor = "pointer";

        const feature = event.features?.[0];
        if (!feature) return;

        const rawId = feature.properties?.ward_id;
        if (rawId === undefined || rawId === null) return;

        const wardId = Number(rawId);
        if (!Number.isFinite(wardId)) return;

        if (hoveredWardId !== null && hoveredWardId !== wardId) {
          map.setFeatureState(
            { source: SOURCE_ID, id: hoveredWardId },
            { hover: false }
          );
        }

        hoveredWardId = wardId;

        map.setFeatureState(
          { source: SOURCE_ID, id: wardId },
          { hover: true }
        );
      });

      map.on("mouseleave", FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";

        if (hoveredWardId !== null) {
          map.setFeatureState(
            { source: SOURCE_ID, id: hoveredWardId },
            { hover: false }
          );
        }

        hoveredWardId = null;
      });

      map.on("click", FILL_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        const properties = feature?.properties;

        if (!properties) return;

        const wardId = Number(properties.ward_id);
        if (!Number.isFinite(wardId)) return;

        onWardClickRef.current?.(wardId);

        const metric = metricRef.current;
        const score = Number(properties[getMetricProperty(metric)]);
        const metricLabel = getMetricLabel(metric);
        const wardName =
          properties.Name2 ?? properties.Name1 ?? `Ward ${wardId}`;
        const level = properties.opportunity_level ?? "Not specified";

        new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "280px",
        })
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:4px;min-width:180px;max-width:100%">
              <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0891B2;margin-bottom:8px">
                Ward ${wardId}
              </div>
              <div style="font-size:16px;font-weight:700;color:#0F172A;margin-bottom:8px">
                ${escapeHtml(wardName)}
              </div>
              <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:.1em">
                ${escapeHtml(metricLabel)}
              </div>
              <div style="font-size:26px;font-weight:800;color:#0891B2">
                ${Number.isFinite(score) ? score.toFixed(1) : "—"}
              </div>
              <div style="margin-top:6px;font-size:11px;color:#64748B">
                Opportunity level: <strong>${escapeHtml(level)}</strong>
              </div>
            </div>
          `)
          .addTo(map);
      });

      fitMapToWards(map, wardsRef.current);

      requestAnimationFrame(() => {
        map.resize();
      });
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update ward data without recreating the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource(SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (!source) return;

    source.setData(wards as GeoJSON.FeatureCollection);
    fitMapToWards(map, wards);
    map.resize();
  }, [wards]);

  // Update ward colours when the selected metric changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(FILL_LAYER_ID)) return;

    map.setPaintProperty(
      FILL_LAYER_ID,
      "fill-color",
      getColorExpression(mapMetric)
    );
  }, [mapMetric]);

  return (
    <div
      ref={mapContainer}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        minHeight: "300px",
      }}
    />
  );
}

function getColorExpression(
  metric: MapMetric
): maplibregl.ExpressionSpecification {
  const property = getMetricProperty(metric);

  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", property], 0],
    0,
    "#172033",
    20,
    "#26364A",
    40,
    "#155E75",
    60,
    "#0891B2",
    80,
    "#14B8A6",
    100,
    "#22D3EE",
  ] as maplibregl.ExpressionSpecification;
}

function fitMapToWards(map: maplibregl.Map, wards: WardGeoJSON) {
  if (!wards.features.length) return;

  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;

  for (const feature of wards.features) {
    if (!feature.geometry) continue;

    addGeometryToBounds(bounds, feature.geometry);
    hasCoordinates = true;
  }

  if (!hasCoordinates || !map.isStyleLoaded()) return;

  const isMobile = window.innerWidth < 640;

  map.fitBounds(bounds, {
    padding: isMobile
      ? { top: 35, bottom: 35, left: 25, right: 25 }
      : { top: 50, bottom: 50, left: 50, right: 50 },
    maxZoom: 11,
    duration: 500,
  });
}

function addGeometryToBounds(
  bounds: maplibregl.LngLatBounds,
  geometry: GeoJSON.Geometry
) {
  const addCoordinate = (coordinate: number[]) => {
    if (
      coordinate.length >= 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
    ) {
      bounds.extend([coordinate[0], coordinate[1]]);
    }
  };

  switch (geometry.type) {
    case "Point":
      addCoordinate(geometry.coordinates);
      break;

    case "MultiPoint":
    case "LineString":
      geometry.coordinates.forEach(addCoordinate);
      break;

    case "MultiLineString":
    case "Polygon":
      geometry.coordinates.forEach((line) =>
        line.forEach(addCoordinate)
      );
      break;

    case "MultiPolygon":
      geometry.coordinates.forEach((polygon) =>
        polygon.forEach((ring) => ring.forEach(addCoordinate))
      );
      break;

    case "GeometryCollection":
      geometry.geometries.forEach((child) =>
        addGeometryToBounds(bounds, child)
      );
      break;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
