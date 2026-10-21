import {
  ArrowLeft,
  BarChart3,
  Check,
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MapView from "../components/MapView";
import WardIntelligencePanel from "../components/WardIntelligencePanel";
import { getAllWards } from "../services/api";

import type {
  OpportunityCategory,
  OpportunityLevel,
  WardFeature,
  WardGeoJSON,
} from "../types/ward";

const LEVEL_OPTIONS: Array<
  "All" | OpportunityLevel
> = [
  "All",
  "Low",
  "Medium",
  "High",
];

const CATEGORY_OPTIONS: Array<
  "All" | OpportunityCategory
> = [
  "All",
  "Education",
  "Healthcare",
  "Food & Retail",
  "Lifestyle",
];

type MapMetric =
  | "opportunity_score"
  | "demand_score"
  | "supply_gap_score"
  | "accessibility_score";

const METRIC_OPTIONS: Array<{
  value: MapMetric;
  label: string;
  description: string;
}> = [
  {
    value: "opportunity_score",
    label: "Opportunity Score",
    description:
      "Overall opportunity potential",
  },
  {
    value: "demand_score",
    label: "Demand",
    description:
      "Population and density pressure",
  },
  {
    value: "supply_gap_score",
    label: "Supply Gap",
    description:
      "Potential underservedness",
  },
  {
    value: "accessibility_score",
    label: "Accessibility",
    description:
      "Transport accessibility",
  },
];

const LEGEND_STOPS = [
  {
    value: 0,
    color: "#172033",
  },
  {
    value: 20,
    color: "#26364A",
  },
  {
    value: 40,
    color: "#155E75",
  },
  {
    value: 60,
    color: "#0891B2",
  },
  {
    value: 80,
    color: "#14B8A6",
  },
  {
    value: 100,
    color: "#22D3EE",
  },
];

function Explore() {
  const [wards, setWards] =
    useState<WardGeoJSON | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [levelFilter, setLevelFilter] =
    useState<
      "All" | OpportunityLevel
    >("All");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    "All" | OpportunityCategory
  >("All");

  const [
    mapMetric,
    setMapMetric,
  ] = useState<MapMetric>(
    "opportunity_score"
  );

  const [
    selectedWard,
    setSelectedWard,
  ] = useState<WardFeature | null>(
    null
  );

  const [
    compareMode,
    setCompareMode,
  ] = useState(false);

  const [
    compareWardIds,
    setCompareWardIds,
  ] = useState<number[]>([]);

  const [
    finderOpen,
    setFinderOpen,
  ] = useState(false);

  const [
    finderCategory,
    setFinderCategory,
  ] = useState<
    "All" | OpportunityCategory
  >("All");

  const [
    finderLevel,
    setFinderLevel,
  ] = useState<
    "All" | OpportunityLevel
  >("All");

  useEffect(() => {
    async function loadWards() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getAllWards();

        setWards(data);
      } catch (err) {
        console.error(
          "Failed to load wards:",
          err
        );

        setError(
          "Unable to load ward intelligence data. Make sure the FastAPI backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWards();
  }, []);

  const filteredWards =
    useMemo<WardGeoJSON | null>(
      () => {
        if (!wards) {
          return null;
        }

        const features =
          wards.features.filter(
            (feature) => {
              const p =
                feature.properties;

              const matchesLevel =
                levelFilter === "All" ||
                p.opportunity_level ===
                  levelFilter;

              const matchesCategory =
                categoryFilter === "All" ||
                p.opportunity_category ===
                  categoryFilter;

              return (
                matchesLevel &&
                matchesCategory
              );
            }
          );

        return {
          type: "FeatureCollection",
          features,
        };
      },
      [
        wards,
        levelFilter,
        categoryFilter,
      ]
    );

  const finderResults =
    useMemo<WardFeature[]>(() => {
      if (!wards) {
        return [];
      }

      return wards.features
        .filter((feature) => {
          const p =
            feature.properties;

          const matchesCategory =
            finderCategory === "All" ||
            p.opportunity_category ===
              finderCategory;

          const matchesLevel =
            finderLevel === "All" ||
            p.opportunity_level ===
              finderLevel;

          return (
            matchesCategory &&
            matchesLevel
          );
        })
        .sort(
          (a, b) =>
            b.properties
              .opportunity_score -
            a.properties
              .opportunity_score
        )
        .slice(0, 5);
    }, [
      wards,
      finderCategory,
      finderLevel,
    ]);

  const compareWards =
    useMemo<WardFeature[]>(() => {
      if (!wards) {
        return [];
      }

      return compareWardIds
        .map((wardId) =>
          wards.features.find(
            (feature) =>
              feature.properties
                .ward_id ===
              wardId
          )
        )
        .filter(
          (
            ward
          ): ward is WardFeature =>
            Boolean(ward)
        );
    }, [
      wards,
      compareWardIds,
    ]);

  const activeFilterCount =
    [
      levelFilter !== "All",
      categoryFilter !== "All",
    ].filter(Boolean).length;

  const currentMetric =
    METRIC_OPTIONS.find(
      (metric) =>
        metric.value === mapMetric
    ) ??
    METRIC_OPTIONS[0];

  function handleReset() {
    setLevelFilter("All");
    setCategoryFilter("All");
    setMapMetric(
      "opportunity_score"
    );
    setSelectedWard(null);
    setCompareMode(false);
    setCompareWardIds([]);
    setFinderOpen(false);
    setFinderCategory("All");
    setFinderLevel("All");
  }

  function handleCompareMode() {
    setCompareMode(
      (current) => !current
    );

    setSelectedWard(null);
    setFinderOpen(false);
  }

  function handleWardClick(
    wardId: number
  ) {
    if (!wards) {
      return;
    }

    const ward =
      wards.features.find(
        (feature) =>
          feature.properties.ward_id ===
          wardId
      );

    if (!ward) {
      return;
    }

    if (compareMode) {
      setSelectedWard(null);

      setCompareWardIds(
        (currentIds) => {
          if (
            currentIds.includes(wardId)
          ) {
            return currentIds.filter(
              (id) => id !== wardId
            );
          }

          if (
            currentIds.length >= 3
          ) {
            return currentIds;
          }

          return [
            ...currentIds,
            wardId,
          ];
        }
      );

      return;
    }

    setSelectedWard(ward);
  }

  function handleFinderSelect(
    ward: WardFeature
  ) {
    setSelectedWard(ward);
    setFinderOpen(false);
    setCompareMode(false);
    setCompareWardIds([]);
  }

  function removeCompareWard(
    wardId: number
  ) {
    setCompareWardIds(
      (currentIds) =>
        currentIds.filter(
          (id) => id !== wardId
        )
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white">
        <header className="border-b border-slate-800/80">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <Brand />
            <BackButton />
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

            <p className="text-sm font-medium text-slate-300">
              Loading Pune intelligence...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Preparing ward-level analytics
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !wards) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white">
        <header className="border-b border-slate-800/80">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <Brand />
            <BackButton />
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6">
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <h1 className="text-lg font-bold">
              Intelligence data unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {error ??
                "Something went wrong while loading the Pune ward dataset."}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#061018] transition hover:bg-cyan-300"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const visibleWards: WardGeoJSON =
    filteredWards ?? {
      type: "FeatureCollection",
      features: [],
    };

  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      <header className="border-b border-slate-800/80 bg-[#070B12]/95">
        <div className="flex h-20 items-center justify-between px-6 lg:px-8">
          <Brand />
          <BackButton />
        </div>
      </header>

      <section className="px-6 pb-5 pt-7 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400">
              <Sparkles size={13} />
              Spatial Intelligence
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Explore Pune
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Explore opportunity scores,
              demand, supply gaps and
              accessibility across
              Pune&apos;s 58 analytical
              wards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />

            <span>
              <span className="font-semibold text-slate-200">
                {
                  visibleWards
                    .features
                    .length
                }
              </span>{" "}
              wards visible
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-4 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-[#0D131C]/90 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Filter
                size={16}
                className="text-cyan-400"
              />

              Filters

              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-[#061018]">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <select
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(
                  event.target.value as
                    | "All"
                    | OpportunityLevel
                )
              }
              className="h-10 rounded-xl border border-slate-700 bg-[#111A25] px-4 text-sm text-slate-200 outline-none transition hover:border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              {LEVEL_OPTIONS.map(
                (level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level === "All"
                      ? "All opportunity levels"
                      : level}
                  </option>
                )
              )}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as
                    | "All"
                    | OpportunityCategory
                )
              }
              className="h-10 rounded-xl border border-slate-700 bg-[#111A25] px-4 text-sm text-slate-200 outline-none transition hover:border-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              {CATEGORY_OPTIONS.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category === "All"
                      ? "All categories"
                      : category}
                  </option>
                )
              )}
            </select>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:ml-1">
              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Visualize by
              </span>

              <select
                value={mapMetric}
                onChange={(event) =>
                  setMapMetric(
                    event.target.value as MapMetric
                  )
                }
                className="h-10 min-w-[190px] rounded-xl border border-cyan-500/40 bg-[#111A25] px-4 text-sm font-medium text-cyan-300 outline-none transition hover:border-cyan-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                {METRIC_OPTIONS.map(
                  (metric) => (
                    <option
                      key={metric.value}
                      value={metric.value}
                    >
                      {metric.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFinderOpen(
                  (current) =>
                    !current
                );

                setSelectedWard(null);
                setCompareMode(false);
                setCompareWardIds([]);
              }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                finderOpen
                  ? "border-cyan-400 bg-cyan-400 text-[#061018] shadow-[0_0_20px_rgba(34,211,238,0.18)]"
                  : "border-cyan-500/30 bg-cyan-500/5 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10"
              }`}
            >
              <Search size={15} />
              Find Opportunities
            </button>

            <button
              type="button"
              onClick={
                handleCompareMode
              }
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                compareMode
                  ? "border-cyan-400 bg-cyan-400 text-[#061018]"
                  : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400"
              }`}
            >
              <BarChart3 size={15} />

              {compareMode
                ? "Comparing"
                : "Compare Wards"}

              {compareWardIds.length >
                0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-400 px-1.5 text-[10px] font-bold text-[#111827]">
                  {
                    compareWardIds.length
                  }
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#111A25] px-4 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <div className="xl:ml-auto">
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs">
                <span className="text-slate-500">
                  Showing
                </span>

                <span className="font-bold text-cyan-300">
                  {
                    visibleWards
                      .features
                      .length
                  }
                </span>

                <span className="text-slate-600">
                  /
                </span>

                <span className="font-semibold text-slate-300">
                  {wards.features.length}
                </span>

                <span className="text-slate-500">
                  wards
                </span>
              </div>
            </div>
          </div>

          {(levelFilter !== "All" ||
            categoryFilter !==
              "All") && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
              <span className="mr-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Active
              </span>

              {levelFilter !==
                "All" && (
                <FilterChip
                  label={`Level: ${levelFilter}`}
                />
              )}

              {categoryFilter !==
                "All" && (
                <FilterChip
                  label={`Category: ${categoryFilter}`}
                />
              )}
            </div>
          )}

          {compareMode && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <BarChart3
                  size={16}
                  className="text-cyan-400"
                />

                <div>
                  <p className="text-xs font-semibold text-cyan-200">
                    Compare mode active
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Click up to 3 wards on
                    the map to compare them.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                {
                  compareWardIds.length
                }
                /3 selected
              </span>
            </div>
          )}
        </div>
      </section>

      {finderOpen && (
        <section className="px-6 pb-4 lg:px-8">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0D131C] p-5 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="w-full lg:w-72">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
                    <Search
                      size={16}
                      className="text-cyan-400"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Opportunity Finder
                    </p>

                    <p className="text-[10px] text-slate-500">
                      Discover the strongest
                      matching wards.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Looking for
                    </label>

                    <select
                      value={
                        finderCategory
                      }
                      onChange={(event) =>
                        setFinderCategory(
                          event.target.value as
                            | "All"
                            | OpportunityCategory
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-700 bg-[#111A25] px-3 text-sm text-slate-200 outline-none focus:border-cyan-400"
                    >
                      {CATEGORY_OPTIONS.map(
                        (category) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {category ===
                            "All"
                              ? "All categories"
                              : category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Opportunity level
                    </label>

                    <select
                      value={
                        finderLevel
                      }
                      onChange={(event) =>
                        setFinderLevel(
                          event.target.value as
                            | "All"
                            | OpportunityLevel
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-700 bg-[#111A25] px-3 text-sm text-slate-200 outline-none focus:border-cyan-400"
                    >
                      {LEVEL_OPTIONS.map(
                        (level) => (
                          <option
                            key={level}
                            value={level}
                          >
                            {level ===
                            "All"
                              ? "All opportunity levels"
                              : level}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Top Opportunities
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        finderResults.length
                      }{" "}
                      matching wards
                    </p>
                  </div>
                </div>

                {finderResults.length ===
                0 ? (
                  <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40">
                    <div className="text-center">
                      <Search
                        size={22}
                        className="mx-auto text-slate-600"
                      />

                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        No matching opportunities
                      </p>

                      <p className="mt-1 text-[10px] text-slate-600">
                        Try a different
                        category or
                        opportunity level.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                    {finderResults.map(
                      (
                        ward,
                        index
                      ) => (
                        <FinderResultCard
                          key={
                            ward
                              .properties
                              .ward_id
                          }
                          ward={ward}
                          rank={
                            index + 1
                          }
                          onSelect={
                            handleFinderSelect
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 pb-8 lg:px-8">
        <div className="relative h-[calc(100vh-310px)] min-h-[560px] overflow-hidden rounded-2xl border border-slate-800 bg-[#0D131C] shadow-2xl shadow-black/20">
          <MapView
            wards={visibleWards}
            onWardClick={
              handleWardClick
            }
            mapMetric={mapMetric}
          />

          <div className="absolute bottom-4 left-4 z-10 w-64 rounded-2xl border border-slate-700/80 bg-[#0B111A]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Map Metric
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  {
                    currentMetric.label
                  }
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  {
                    currentMetric.description
                  }
                </p>
              </div>

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                <Sparkles
                  size={13}
                  className="text-cyan-400"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                {LEGEND_STOPS.map(
                  (stop) => (
                    <div
                      key={
                        stop.value
                      }
                      className="flex-1"
                      style={{
                        backgroundColor:
                          stop.color,
                      }}
                    />
                  )
                )}
              </div>

              <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-500">
                {LEGEND_STOPS.map(
                  (stop) => (
                    <span
                      key={
                        stop.value
                      }
                    >
                      {stop.value}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                Lower
              </span>

              <span className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
                Higher
              </span>
            </div>
          </div>

          {!compareMode && (
            <WardIntelligencePanel
              ward={selectedWard}
              onClose={() =>
                setSelectedWard(null)
              }
            />
          )}

          {compareMode && (
            <CompareTray
              wards={compareWards}
              onRemove={
                removeCompareWard
              }
              onClear={() =>
                setCompareWardIds([])
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}

function FinderResultCard({
  ward,
  rank,
  onSelect,
}: {
  ward: WardFeature;
  rank: number;
  onSelect: (
    ward: WardFeature
  ) => void;
}) {
  const p = ward.properties;

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(ward)
      }
      className="group rounded-xl border border-slate-800 bg-[#111A25] p-3 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-[10px] font-bold text-cyan-400">
          #{rank}
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-400">
          {p.opportunity_level}
        </span>
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
        Ward {p.ward_id}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-white">
        {p.Name1}
      </p>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-[0.12em] text-slate-600">
            Opportunity
          </p>

          <p className="mt-0.5 text-lg font-black text-cyan-300">
            {p.opportunity_score.toFixed(
              1
            )}
          </p>
        </div>

        <span className="max-w-[90px] truncate rounded-md border border-slate-700 px-2 py-1 text-[8px] font-medium text-slate-400">
          {p.opportunity_category}
        </span>
      </div>

      <p className="mt-3 truncate border-t border-slate-800 pt-2 text-[9px] text-slate-500">
        {p.cluster ??
          "Unclassified"}
      </p>
    </button>
  );
}

function CompareTray({
  wards,
  onRemove,
  onClear,
}: {
  wards: WardFeature[];
  onRemove: (
    wardId: number
  ) => void;
  onClear: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-4 z-20 w-[min(760px,calc(100%-2rem))] rounded-2xl border border-cyan-500/25 bg-[#0B111A]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3
              size={15}
              className="text-cyan-400"
            />

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              Ward Comparison
            </p>
          </div>

          <p className="mt-1 text-[10px] text-slate-500">
            Compare selected wards across
            key intelligence indicators.
          </p>
        </div>

        {wards.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 transition hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {wards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-6 text-center">
          <BarChart3
            size={22}
            className="mx-auto text-slate-600"
          />

          <p className="mt-2 text-xs font-semibold text-slate-400">
            No wards selected
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            Click a ward on the map to
            add it to the comparison.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {wards.map((ward) => (
            <CompareWardCard
              key={
                ward.properties
                  .ward_id
              }
              ward={ward}
              onRemove={
                onRemove
              }
            />
          ))}

          {wards.length < 3 &&
            Array.from({
              length:
                3 - wards.length,
            }).map(
              (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="hidden min-h-[190px] rounded-xl border border-dashed border-slate-800 bg-slate-900/30 md:flex md:items-center md:justify-center"
                >
                  <span className="text-[9px] uppercase tracking-[0.15em] text-slate-700">
                    Select another ward
                  </span>
                </div>
              )
            )}
        </div>
      )}
    </div>
  );
}

function CompareWardCard({
  ward,
  onRemove,
}: {
  ward: WardFeature;
  onRemove: (
    wardId: number
  ) => void;
}) {
  const p = ward.properties;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111A25] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400">
            Ward {p.ward_id}
          </p>

          <p className="mt-1 truncate text-sm font-bold text-white">
            {p.Name1}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onRemove(
              p.ward_id
            )
          }
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-500 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        >
          <X size={13} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CompareMetric
          label="Opportunity"
          value={formatScore(
            p.opportunity_score
          )}
          highlight
        />

        <CompareMetric
          label="Demand"
          value={formatScore(
            p.demand_score
          )}
        />

        <CompareMetric
          label="Supply Gap"
          value={formatScore(
            p.supply_gap_score
          )}
        />

        <CompareMetric
          label="Access"
          value={formatScore(
            p.accessibility_score
          )}
        />

        <CompareMetric
          label="Population"
          value={formatNumber(
            p.population
          )}
        />

        <CompareMetric
          label="PMPML Stops"
          value={formatNumber(
            p.pmpml_stops
          )}
        />
      </div>

      <div className="mt-3 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
            Opportunity
          </span>

          <span className="text-[10px] font-semibold text-cyan-300">
            {p.opportunity_category}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
            Cluster
          </span>

          <span className="max-w-[65%] text-right text-[10px] font-medium text-slate-400">
            {p.cluster ??
              "Unclassified"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CompareMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        highlight
          ? "border-cyan-500/20 bg-cyan-500/5"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <p className="text-[8px] uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          highlight
            ? "text-cyan-300"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[10px] font-medium text-cyan-300">
      <Check size={11} />
      {label}
    </span>
  );
}

function formatScore(
  value: number | undefined
): string {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(value)
  ) {
    return "—";
  }

  return value.toFixed(1);
}

function formatNumber(
  value: number | undefined
): string {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
        <Sparkles size={16} />
      </div>

      <div>
        <p className="text-sm font-bold tracking-tight text-white">
          Urban Opportunity Mapper
        </p>

        <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-cyan-500">
          Pune Intelligence
        </p>
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.history.back()
      }
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-[#0D131C] px-4 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
    >
      <ArrowLeft size={15} />
      Back
    </button>
  );
}

export default Explore;