
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bus,
  MapPin,
  Search,
  Users,
  ArrowLeft,
} from "lucide-react";

type Ward = {
  ward_id?: number | string;
  id?: number | string;
  ward_name?: string;
  name?: string;
  Name1?: string;
  Name2?: string;
  population?: number;
  estimated_population?: number;
  population_density?: number;
  density?: number;
  opportunity_score?: number;
  demand_score?: number;
  supply_score?: number;
  supply_gap_score?: number;
  accessibility_score?: number;
  total_pois?: number;
  pois_count?: number;
  pmpml_stops?: number;
  stops_count?: number;
};

type WardFeature = {
  id?: string | number;
  properties?: Ward;
};

const API_URL = "http://127.0.0.1:8000";

function getWardId(ward: Ward) {
  return ward.ward_id ?? ward.id ?? "";
}

function getWardName(ward: Ward) {
  // Name2 contains the clean ward name in the current API data.
  if (ward.Name2?.trim()) {
    return ward.Name2.trim();
  }

  if (ward.ward_name?.trim()) {
    return ward.ward_name.trim();
  }

  if (ward.name?.trim()) {
    return ward.name.trim();
  }

  // Fall back to Name1 after removing its leading ward number.
  if (ward.Name1?.trim()) {
    return ward.Name1.replace(/^\d+\s*/, "").trim();
  }

  return `Ward ${getWardId(ward)}`;
}

function getNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function getPopulation(ward: Ward) {
  return getNumber(ward.population ?? ward.estimated_population);
}

export default function Analytics() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadWards() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/wards`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result: unknown = await response.json();

        let rows: Ward[] = [];

        if (Array.isArray(result)) {
          rows = result as Ward[];
        } else if (result && typeof result === "object") {
          const data = result as {
            wards?: Ward[];
            features?: WardFeature[];
          };

          if (Array.isArray(data.wards)) {
            rows = data.wards;
          } else if (Array.isArray(data.features)) {
            rows = data.features.map((feature) => ({
              ...(feature.properties ?? {}),
              id: feature.properties?.ward_id ?? feature.id,
            }));
          }
        }

        setWards(rows);

        if (rows.length === 0) {
          setError("The API responded, but no ward records were found.");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          "Unable to load ward data. Make sure the backend is running and /api/wards returns ward records."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadWards();

    return () => controller.abort();
  }, []);

  const filteredWards = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return wards;

    return wards.filter((ward) => {
      const name = getWardName(ward).toLowerCase();
      return (
        name.includes(query) ||
        String(getWardId(ward)).includes(query)
      );
    });
  }, [wards, search]);

  const metrics = useMemo(() => {
    const average = (selector: (ward: Ward) => number) =>
      wards.length
        ? wards.reduce((total, ward) => total + selector(ward), 0) /
          wards.length
        : 0;

    return {
      population: wards.reduce(
        (total, ward) => total + getPopulation(ward),
        0
      ),
      opportunity: average((ward) =>
        getNumber(ward.opportunity_score)
      ),
      demand: average((ward) => getNumber(ward.demand_score)),
      supplyGap: average((ward) =>
        getNumber(ward.supply_gap_score)
      ),
    };
  }, [wards]);

  const metricCards = [
    {
      label: "Analytical Wards",
      value: formatNumber(wards.length),
      icon: MapPin,
    },
    {
      label: "Total Population",
      value: formatNumber(metrics.population),
      icon: Users,
    },
    {
      label: "Average Opportunity",
      value: formatNumber(metrics.opportunity, 1),
      icon: Activity,
    },
    {
      label: "Average Demand",
      value: formatNumber(metrics.demand, 1),
      icon: BarChart3,
    },
  ];

  return (
    <main className="min-h-screen bg-[#070B12] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Urban Opportunity Mapper
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Pune Analytics Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Explore ward-level population and opportunity indicators.
            </p>
          </div>

          <Link
            to="/explore"
            className="rounded-xl border border-cyan-400/30 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
          >
            Open Intelligence Map →
          </Link>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200"
          >
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-800 bg-[#0D131C] p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <Icon className="text-cyan-400" size={20} />
                </div>

                <p className="mt-4 break-words text-2xl font-bold text-white sm:text-3xl">
                  {loading ? "..." : item.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0D131C] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Ward Intelligence</h2>
              <p className="mt-1 text-sm text-slate-400">
                Search wards and open their detailed analysis.
              </p>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#070B12] px-3 py-2">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ward..."
                aria-label="Search wards"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-500 sm:w-56"
              />
            </label>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-4">Ward</th>
                  <th className="px-3 py-4">Population</th>
                  <th className="px-3 py-4">Opportunity</th>
                  <th className="px-3 py-4">Demand</th>
                  <th className="px-3 py-4">Supply Gap</th>
                  <th className="px-3 py-4">Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredWards.map((ward, index) => {
                  const id = getWardId(ward);

                  return (
                    <tr
                      key={String(id || index)}
                      className="border-b border-slate-800/70 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-4 font-medium">
                        {getWardName(ward)}
                      </td>

                      <td className="px-3 py-4 tabular-nums">
                        {formatNumber(getPopulation(ward))}
                      </td>

                      <td className="px-3 py-4 tabular-nums text-cyan-300">
                        {formatNumber(
                          getNumber(ward.opportunity_score),
                          1
                        )}
                      </td>

                      <td className="px-3 py-4 tabular-nums">
                        {formatNumber(getNumber(ward.demand_score), 1)}
                      </td>

                      <td className="px-3 py-4 tabular-nums">
                        {formatNumber(
                          getNumber(ward.supply_gap_score),
                          1
                        )}
                      </td>

                      <td className="px-3 py-4">
                        {id !== "" && (
                          <Link
                            to={`/app/ward/${id}`}
                            className="text-cyan-300 hover:text-cyan-100"
                          >
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {loading && (
              <p className="py-8 text-center text-slate-400">
                Loading ward data...
              </p>
            )}

            {!loading && filteredWards.length === 0 && !error && (
              <p className="py-8 text-center text-slate-400">
                No matching wards found.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-[#0D131C] p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-cyan-400" />
              <h2 className="font-bold">Supply Gap Analysis</h2>
            </div>

            <p className="mt-4 text-3xl font-bold text-cyan-300">
              {loading ? "..." : formatNumber(metrics.supplyGap, 1)}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Average supply-gap score across the wards returned by the
              API. A positive gap can indicate that measured demand
              exceeds supply.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-[#0D131C] p-6">
            <div className="flex items-center gap-3">
              <Bus className="text-cyan-400" />
              <h2 className="font-bold">Transport & Accessibility</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Explore mapped PMPML bus stops and ward accessibility on
              the intelligence map and individual ward pages.
            </p>

            <Link
              to="/explore"
              className="mt-5 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-100"
            >
              Explore the map →
            </Link>
          </article>
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">
          URBAN OPPORTUNITY MAPPER · GEOSPATIAL ANALYTICS FOR PUNE
        </footer>
      </div>
    </main>
  );
}
