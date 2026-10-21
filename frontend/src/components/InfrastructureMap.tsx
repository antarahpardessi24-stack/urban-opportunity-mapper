import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(workerUrl);

interface InfrastructureMapProps {
  wardId: number;
}

type Properties = Record<string, unknown>;
type PointCollection = FeatureCollection<Point, Properties>;
type WardFeature = Feature<Polygon | MultiPolygon, Properties>;
type LayerMode = "all" | "pois" | "stops";

const API_BASE = "http://127.0.0.1:8000";

const EMPTY_POINTS: PointCollection = {
  type: "FeatureCollection",
  features: [],
};

function getDisplayValue(
  properties: Properties,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    const value = properties[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value);
    }
  }
  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeWard(data: unknown): WardFeature {
  let candidate = data as {
    type?: string;
    geometry?: Geometry | null;
    properties?: Properties | null;
    features?: Array<{
      type?: string;
      geometry?: Geometry | null;
      properties?: Properties | null;
    }>;
  };

  if (
    candidate?.type === "FeatureCollection" &&
    Array.isArray(candidate.features)
  ) {
    candidate = candidate.features[0] ?? {};
  }

  const geometry = candidate?.geometry;
  if (
    !geometry ||
    (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")
  ) {
    throw new Error("The ward API did not return a valid ward boundary.");
  }

  return {
    type: "Feature",
    geometry,
    properties: candidate.properties ?? {},
  } as WardFeature;
}

function normalizePoints(data: unknown): PointCollection {
  const candidate = data as {
    features?: Array<{
      geometry?: Geometry | null;
      properties?: Properties | null;
    }>;
  };

  const features = Array.isArray(candidate?.features)
    ? candidate.features
    : [];

  return {
    type: "FeatureCollection",
    features: features
      .filter(
        (feature): feature is Feature<Point, Properties> =>
          feature?.geometry?.type === "Point" &&
          Array.isArray(feature.geometry.coordinates) &&
          feature.geometry.coordinates.length >= 2
      )
      .map((feature) => ({
        type: "Feature",
        geometry: feature.geometry as Point,
        properties: feature.properties ?? {},
      })),
  };
}

export default function InfrastructureMap({
  wardId,
}: InfrastructureMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [ward, setWard] = useState<WardFeature | null>(null);
  const [pois, setPois] = useState<PointCollection>(EMPTY_POINTS);
  const [stops, setStops] = useState<PointCollection>(EMPTY_POINTS);
  const [mode, setMode] = useState<LayerMode>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInfrastructure() {
      setLoading(true);
      setError(null);
      setMapReady(false);
      setWard(null);
      setPois(EMPTY_POINTS);
      setStops(EMPTY_POINTS);

      try {
        const [wardResponse, poiResponse, stopResponse] = await Promise.all([
          fetch(`${API_BASE}/api/wards/${wardId}`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/api/wards/${wardId}/pois`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/api/wards/${wardId}/stops`, {
            signal: controller.signal,
          }),
        ]);

        if (!wardResponse.ok) {
          throw new Error(`Ward request failed with status ${wardResponse.status}.`);
        }
        if (!poiResponse.ok) {
          throw new Error(`POI request failed with status ${poiResponse.status}.`);
        }
        if (!stopResponse.ok) {
          throw new Error(`Bus-stop request failed with status ${stopResponse.status}.`);
        }

        const [wardData, poiData, stopData] = await Promise.all([
          wardResponse.json(),
          poiResponse.json(),
          stopResponse.json(),
        ]);

        if (controller.signal.aborted) return;

        setWard(normalizeWard(wardData));
        setPois(normalizePoints(poiData));
        setStops(normalizePoints(stopData));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load infrastructure data."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadInfrastructure();
    return () => controller.abort();
  }, [wardId]);

  useEffect(() => {
    if (!mapContainerRef.current || !ward || error) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [73.8567, 18.5204],
      zoom: 10,
      // MapLibre expects false or AttributionControlOptions here, not boolean true.
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-base",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      if (mapRef.current !== map) return;

      map.addSource("ward-boundary", {
        type: "geojson",
        data: ward,
      });

      map.addLayer({
        id: "ward-fill",
        type: "fill",
        source: "ward-boundary",
        paint: {
          "fill-color": "#22D3EE",
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "ward-outline",
        type: "line",
        source: "ward-boundary",
        paint: {
          "line-color": "#22D3EE",
          "line-width": 2.5,
        },
      });

      map.addSource("poi-points", {
        type: "geojson",
        data: EMPTY_POINTS,
      });

      map.addLayer({
        id: "poi-circles",
        type: "circle",
        source: "poi-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 6],
          "circle-color": "#22D3EE",
          "circle-opacity": 0.9,
          "circle-stroke-color": "#07111C",
          "circle-stroke-width": 1,
        },
      });

      map.addSource("bus-stop-points", {
        type: "geojson",
        data: EMPTY_POINTS,
      });

      map.addLayer({
        id: "bus-stop-circles",
        type: "circle",
        source: "bus-stop-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 6],
          "circle-color": "#A78BFA",
          "circle-opacity": 0.95,
          "circle-stroke-color": "#17102B",
          "circle-stroke-width": 1,
        },
      });

      const bounds = new maplibregl.LngLatBounds();

      function extendBounds(geometry: Polygon | MultiPolygon) {
        const visit = (coordinates: unknown): void => {
          if (!Array.isArray(coordinates)) return;
          if (
            coordinates.length >= 2 &&
            typeof coordinates[0] === "number" &&
            typeof coordinates[1] === "number"
          ) {
            bounds.extend([coordinates[0], coordinates[1]]);
            return;
          }
          coordinates.forEach(visit);
        };
        visit(geometry.coordinates);
      }

      extendBounds(ward.geometry);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 45,
          maxZoom: 13,
          duration: 700,
        });
      }

      setMapReady(true);
    });

    function showPopup(
      event: maplibregl.MapMouseEvent,
      layerId: string,
      nameKeys: string[],
      detailKeys: string[],
      fallback: string
    ) {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [layerId],
      });
      const properties = features[0]?.properties as Properties | undefined;
      if (!properties) return;

      const name = getDisplayValue(properties, nameKeys, fallback);
      const detail = getDisplayValue(properties, detailKeys, "");

      const popupContent = `
        <div style="font-family:Arial,sans-serif;color:#111827;min-width:150px;max-width:230px;padding:3px">
          <strong style="font-size:14px">${escapeHtml(name)}</strong>
          ${
            detail
              ? `<div style="margin-top:6px;font-size:12px;color:#4B5563">${escapeHtml(detail)}</div>`
              : ""
          }
        </div>
      `;

      new maplibregl.Popup({ closeButton: true, maxWidth: "260px" })
        .setLngLat(event.lngLat)
        .setHTML(popupContent)
        .addTo(map);
    }

    map.on("click", "poi-circles", (event) => {
      showPopup(
        event,
        "poi-circles",
        ["name", "poi_name", "amenity", "category"],
        ["category", "amenity", "shop"],
        "Point of interest"
      );
    });

    map.on("click", "bus-stop-circles", (event) => {
      showPopup(
        event,
        "bus-stop-circles",
        ["stop_name", "name"],
        ["stop_id"],
        "PMPML bus stop"
      );
    });

    map.on("mouseenter", "poi-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "poi-circles", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "bus-stop-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "bus-stop-circles", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [ward, error]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const poiSource = map.getSource("poi-points") as
      | maplibregl.GeoJSONSource
      | undefined;
    const stopSource = map.getSource("bus-stop-points") as
      | maplibregl.GeoJSONSource
      | undefined;

    poiSource?.setData(pois);
    stopSource?.setData(stops);

    if (map.getLayer("poi-circles")) {
      map.setLayoutProperty(
        "poi-circles",
        "visibility",
        mode === "stops" ? "none" : "visible"
      );
    }

    if (map.getLayer("bus-stop-circles")) {
      map.setLayoutProperty(
        "bus-stop-circles",
        "visibility",
        mode === "pois" ? "none" : "visible"
      );
    }
  }, [pois, stops, mode, mapReady]);

  return (
    <section className="w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Infrastructure Map</h2>
          <p className="mt-1 text-sm text-slate-400">
            Explore amenities and PMPML bus stops within this ward.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All layers"],
              ["pois", "Amenities"],
              ["stops", "PMPML stops"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                mode === value
                  ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Ward</p>
          <p className="mt-1 text-2xl font-semibold text-white">{wardId}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Amenities</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-300">
            {pois.features.length.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">PMPML stops</p>
          <p className="mt-1 text-2xl font-semibold text-violet-300">
            {stops.features.length.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="font-medium text-red-300">
            Could not load infrastructure data
          </p>
          <p className="mt-1 text-sm text-red-200/80">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            Make sure your FastAPI backend is running at http://127.0.0.1:8000.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex min-h-20 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="animate-pulse text-sm text-slate-400">
            Loading ward infrastructure...
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className="h-[420px] w-full sm:h-[520px]"
            aria-label={`Infrastructure map for ward ${wardId}`}
          />

          {!loading && !error && (
            <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-slate-700 bg-slate-950/90 p-3 shadow-lg">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                Map legend
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Amenities / POIs
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                PMPML bus stops
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm border border-cyan-400" />
                Ward boundary
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Data is loaded from your Urban Opportunity Mapper API. Map tiles require
        an internet connection. Point locations and counts depend on the
        currently available source data.
      </p>
    </section>
  );
}
