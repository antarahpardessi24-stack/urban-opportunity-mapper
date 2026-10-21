import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  Bus,
  GraduationCap,
  HeartPulse,
  MapPin,
  Store,
  Users,
  Utensils,
  TreePine,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { Feature, Polygon, MultiPolygon } from "geojson";
import InfrastructureMap from "../components/InfrastructureMap";

type OpportunityLevel = "Low" | "Medium" | "High";

type OpportunityCategory =
  | "Education"
  | "Healthcare"
  | "Food & Retail"
  | "Lifestyle";

type OpportunityCluster =
  | "High-Demand Underserved"
  | "Accessible Underserved"
  | "Well-Served"
  | "Low-Supply Opportunity";

interface WardProperties {
  ward_id: number;
  Name1: string;
  Name2: string;
  area_km2?: number;
  population: number;
  worldpop_area_km2?: number;
  worldpop_density?: number;
  population_density_per_km2: number;

  cafe: number;
  restaurant: number;
  fast_food: number;
  hospital: number;
  clinic: number;
  pharmacy: number;
  school: number;
  college: number;
  university: number;
  gym: number;
  supermarket: number;
  convenience: number;
  park: number;

  total_pois: number;
  pmpml_stops: number;

  demand_score: number;
  food_retail_score?: number;
  healthcare_score?: number;
  education_score?: number;
  lifestyle_score?: number;

  supply_score: number;
  supply_gap: number;
  supply_gap_score: number;
  accessibility_score: number;

  opportunity_score: number;
  opportunity_level: OpportunityLevel;
  opportunity_category: OpportunityCategory;

  cluster_id: number;
  cluster: OpportunityCluster;
  cluster_rank?: number;
  opportunity_rank: number;
}

type WardFeature = Feature<Polygon | MultiPolygon, WardProperties>;

const API_BASE = "http://127.0.0.1:8000";

function formatNumber(value: number | undefined, decimals = 0) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function formatScore(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

function getCategoryIcon(category: OpportunityCategory) {
  switch (category) {
    case "Education":
      return GraduationCap;
    case "Healthcare":
      return HeartPulse;
    case "Food & Retail":
      return Store;
    case "Lifestyle":
      return TreePine;
    default:
      return BarChart3;
  }
}

function getLevelClass(level: OpportunityLevel) {
  if (level === "High") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }

  if (level === "Medium") {
    return "border-indigo-400/30 bg-indigo-400/10 text-indigo-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function getClusterClass(cluster: OpportunityCluster) {
  switch (cluster) {
    case "High-Demand Underserved":
      return "border-rose-400/30 bg-rose-400/10 text-rose-300";
    case "Accessible Underserved":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    case "Well-Served":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "Low-Supply Opportunity":
      return "border-violet-400/30 bg-violet-400/10 text-violet-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2.5">
          <Icon size={18} className="text-cyan-300" />
        </div>
      </div>
    </div>
  );
}

function SupplyRow({
  label,
  value,
  maxValue,
  icon: Icon,
}: {
  label: string;
  value: number;
  maxValue: number;
  icon: typeof Store;
}) {
  const percentage =
    maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-slate-400" />
          <span className="text-sm text-slate-300">{label}</span>
        </div>

        <span className="text-sm font-semibold text-white">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#202B38]">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>

        <span className="text-sm font-semibold text-white">
          {safeValue.toFixed(1)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#202B38]">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof GraduationCap;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[#202B38] bg-[#0D131C] p-4">
      <div className="flex gap-3">
        <div className="shrink-0 rounded-lg bg-cyan-400/10 p-2">
          <Icon size={17} className="text-cyan-300" />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function WardDetails() {
  const { id } = useParams<{ id: string }>();

  const [ward, setWard] = useState<WardFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWard() {
      if (!id) {
        setError("Ward ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/wards/${id}`);

        if (!response.ok) {
          throw new Error(`Ward ${id} could not be found.`);
        }

        const data = (await response.json()) as WardFeature;
        setWard(data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load ward information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWard();
  }, [id]);

  const p = ward?.properties;

  const maxSupplyMetric = useMemo(() => {
    if (!p) return 1;

    return Math.max(
      p.restaurant,
      p.cafe,
      p.fast_food,
      p.supermarket,
      p.convenience,
      p.hospital,
      p.clinic,
      p.pharmacy,
      p.school,
      p.college,
      p.university,
      p.gym,
      p.park,
      1
    );
  }, [p]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-4">
              <Loader2 size={28} className="animate-spin text-cyan-400" />
            </div>

            <div className="text-center">
              <p className="font-medium text-white">
                Loading ward intelligence...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Fetching geospatial analysis
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !p) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-400/20 bg-[#111A25] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
              <AlertCircle className="text-red-300" size={24} />
            </div>

            <h1 className="mt-5 text-2xl font-bold">
              Ward data unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {error || "We could not load the requested ward."}
            </p>

            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#061018] transition hover:bg-cyan-300"
            >
              <ArrowLeft size={16} />
              Back to Explore
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const CategoryIcon = getCategoryIcon(p.opportunity_category);
  const supplyGapPositive = p.supply_gap >= 0;

  const recommendations = [
    {
      icon: CategoryIcon,
      title: `${p.opportunity_category} opportunity`,
      text: `This ward's lowest-scoring opportunity category is ${p.opportunity_category}. The area may benefit from additional services in this segment.`,
    },
    {
      icon: Users,
      title: "High demand potential",
      text:
        p.demand_score >= 60
          ? "Population demand is relatively strong, making this ward a potential target for new urban services."
          : "Demand is moderate compared with the other wards in the study area.",
    },
    {
      icon: Bus,
      title: "Accessibility",
      text:
        p.accessibility_score >= 60
          ? "Transport accessibility is relatively strong, which can support service expansion and customer reach."
          : "Improving transport connectivity could strengthen access to opportunities in this ward.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#202B38] bg-[#070B12]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/explore"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#202B38] bg-[#111A25] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
              aria-label="Back to Explore"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Urban Opportunity Mapper
              </p>
              <h1 className="mt-0.5 text-sm font-semibold text-white">
                Ward Intelligence
              </h1>
            </div>
          </div>

          <Link
            to="/explore"
            className="hidden items-center gap-2 rounded-lg border border-[#202B38] bg-[#111A25] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300 sm:flex"
          >
            <MapPin size={14} />
            Explore Map
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8 lg:py-10">
        {/* Ward Hero */}
        <section className="rounded-3xl border border-[#202B38] bg-[#0D131C] p-6 lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                  Ward {p.ward_id}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getLevelClass(
                    p.opportunity_level
                  )}`}
                >
                  {p.opportunity_level} Opportunity
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getClusterClass(
                    p.cluster
                  )}`}
                >
                  {p.cluster}
                </span>
              </div>

              <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white lg:text-4xl">
                {p.Name1}
              </h2>

              <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={15} />
                Pune Metropolitan Region
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-xl border border-[#202B38] bg-[#111A25] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    Opportunity
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cyan-300">
                    {p.opportunity_category}
                  </p>
                </div>

                <div className="rounded-xl border border-[#202B38] bg-[#111A25] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    City Rank
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    #{p.opportunity_rank}
                  </p>
                </div>

                <div className="rounded-xl border border-[#202B38] bg-[#111A25] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    ML Cluster
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    #{p.cluster_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Opportunity Score */}
            <div className="min-w-[250px] rounded-2xl border border-cyan-400/20 bg-[#111A25] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Opportunity Score
                  </p>
                  <p className="mt-2 text-5xl font-bold tracking-tight text-cyan-300">
                    {formatScore(p.opportunity_score)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">out of 100</p>
                </div>

                <div className="rounded-xl bg-cyan-400/10 p-3">
                  <ArrowUpRight size={22} className="text-cyan-300" />
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#202B38]">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: `${Math.min(
                      Math.max(p.opportunity_score, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core Metrics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Population"
            value={formatNumber(p.population)}
            description="Estimated population"
          />

          <MetricCard
            icon={BarChart3}
            label="Density"
            value={`${formatNumber(p.population_density_per_km2)}/km²`}
            description="Population density"
          />

          <MetricCard
            icon={Building2}
            label="Total POIs"
            value={formatNumber(p.total_pois)}
            description="Mapped urban amenities"
          />

          <MetricCard
            icon={Bus}
            label="PMPML Stops"
            value={formatNumber(p.pmpml_stops)}
            description="Mapped transport stops"
          />
        </section>

        {/* Infrastructure Map */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#111A25] p-5 lg:p-6">
          <InfrastructureMap wardId={p.ward_id} />
        </section>

        {/* Scores */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Opportunity Model
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                Demand & accessibility
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                How the ward performs across the main opportunity dimensions.
              </p>
            </div>

            <div className="space-y-5">
              <ScoreBar label="Demand Score" value={p.demand_score} />
              <ScoreBar label="Supply Gap Score" value={p.supply_gap_score} />
              <ScoreBar
                label="Accessibility Score"
                value={p.accessibility_score}
              />
              <ScoreBar
                label="Overall Opportunity"
                value={p.opportunity_score}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Supply Analysis
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                Demand vs supply
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Positive supply gap indicates demand exceeds measured supply.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#202B38] bg-[#0D131C] p-4">
                <p className="text-xs text-slate-500">Demand</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatScore(p.demand_score)}
                </p>
              </div>

              <div className="rounded-xl border border-[#202B38] bg-[#0D131C] p-4">
                <p className="text-xs text-slate-500">Supply</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {formatScore(p.supply_score)}
                </p>
              </div>

              <div className="rounded-xl border border-[#202B38] bg-[#0D131C] p-4">
                <p className="text-xs text-slate-500">Gap</p>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    supplyGapPositive ? "text-cyan-300" : "text-slate-300"
                  }`}
                >
                  {p.supply_gap > 0 ? "+" : ""}
                  {formatScore(p.supply_gap)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <p className="text-sm leading-6 text-slate-300">
                {supplyGapPositive
                  ? "This ward shows a positive demand-supply imbalance, indicating potential room for additional urban services."
                  : "Measured supply is relatively strong compared with the modelled demand for this ward."}
              </p>
            </div>
          </div>
        </section>

        {/* Opportunity Category */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#111A25] p-6 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-cyan-400/10 p-3">
                <CategoryIcon size={24} className="text-cyan-300" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                  Primary Opportunity
                </p>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  {p.opportunity_category}
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-[#202B38] bg-[#0D131C] px-5 py-3">
              <p className="text-xs text-slate-500">Opportunity Rank</p>
              <p className="mt-1 text-lg font-bold text-cyan-300">
                #{p.opportunity_rank}
              </p>
            </div>
          </div>
        </section>

        {/* Supply Breakdown */}
        <section className="mt-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
              Urban Supply
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Amenity breakdown
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Mapped amenities and services inside the ward boundary.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Food & Retail */}
            <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-orange-400/10 p-2.5">
                  <Utensils size={18} className="text-orange-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Food & Retail</h4>
                  <p className="text-xs text-slate-500">
                    Consumer-facing amenities
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <SupplyRow
                  label="Restaurants"
                  value={p.restaurant}
                  maxValue={maxSupplyMetric}
                  icon={Utensils}
                />
                <SupplyRow
                  label="Cafes"
                  value={p.cafe}
                  maxValue={maxSupplyMetric}
                  icon={Utensils}
                />
                <SupplyRow
                  label="Fast Food"
                  value={p.fast_food}
                  maxValue={maxSupplyMetric}
                  icon={Utensils}
                />
                <SupplyRow
                  label="Supermarkets"
                  value={p.supermarket}
                  maxValue={maxSupplyMetric}
                  icon={Store}
                />
                <SupplyRow
                  label="Convenience Stores"
                  value={p.convenience}
                  maxValue={maxSupplyMetric}
                  icon={Store}
                />
              </div>
            </div>

            {/* Healthcare */}
            <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-rose-400/10 p-2.5">
                  <HeartPulse size={18} className="text-rose-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Healthcare</h4>
                  <p className="text-xs text-slate-500">
                    Health and medical services
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <SupplyRow
                  label="Hospitals"
                  value={p.hospital}
                  maxValue={maxSupplyMetric}
                  icon={HeartPulse}
                />
                <SupplyRow
                  label="Clinics"
                  value={p.clinic}
                  maxValue={maxSupplyMetric}
                  icon={HeartPulse}
                />
                <SupplyRow
                  label="Pharmacies"
                  value={p.pharmacy}
                  maxValue={maxSupplyMetric}
                  icon={HeartPulse}
                />
              </div>
            </div>

            {/* Education */}
            <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-400/10 p-2.5">
                  <GraduationCap size={18} className="text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Education</h4>
                  <p className="text-xs text-slate-500">
                    Learning institutions
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <SupplyRow
                  label="Schools"
                  value={p.school}
                  maxValue={maxSupplyMetric}
                  icon={GraduationCap}
                />
                <SupplyRow
                  label="Colleges"
                  value={p.college}
                  maxValue={maxSupplyMetric}
                  icon={GraduationCap}
                />
                <SupplyRow
                  label="Universities"
                  value={p.university}
                  maxValue={maxSupplyMetric}
                  icon={GraduationCap}
                />
              </div>
            </div>

            {/* Lifestyle */}
            <div className="rounded-2xl border border-[#202B38] bg-[#111A25] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-2.5">
                  <TreePine size={18} className="text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Lifestyle</h4>
                  <p className="text-xs text-slate-500">
                    Recreation and fitness
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <SupplyRow
                  label="Gyms"
                  value={p.gym}
                  maxValue={maxSupplyMetric}
                  icon={TreePine}
                />
                <SupplyRow
                  label="Parks"
                  value={p.park}
                  maxValue={maxSupplyMetric}
                  icon={TreePine}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Opportunity Score Comparison */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#111A25] p-6 lg:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
              Score Comparison
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Opportunity score profile
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Comparison of the ward's major model dimensions on a 0–100 scale.
            </p>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Demand", score: p.demand_score },
                  { name: "Supply", score: p.supply_score },
                  { name: "Supply Gap Score", score: p.supply_gap_score },
                  { name: "Accessibility", score: p.accessibility_score },
                  { name: "Opportunity", score: p.opportunity_score },
                ]}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#202B38"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={{ stroke: "#202B38" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={125}
                  tick={{ fill: "#CBD5E1", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111A25",
                    border: "1px solid #202B38",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                  labelStyle={{ color: "#CBD5E1" }}
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(1)}`,
                    "Score",
                  ]}
                />
                <Bar
                  dataKey="score"
                  fill="#22D3EE"
                  radius={[0, 6, 6, 0]}
                  barSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Amenity Supply Distribution */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#111A25] p-6 lg:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
              Infrastructure Profile
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Amenity supply distribution
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Number of mapped amenities across the ward's major service categories.
            </p>
          </div>

          <div className="h-[470px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Restaurants", value: p.restaurant },
                  { name: "Cafes", value: p.cafe },
                  { name: "Fast Food", value: p.fast_food },
                  { name: "Supermarkets", value: p.supermarket },
                  { name: "Convenience", value: p.convenience },
                  { name: "Hospitals", value: p.hospital },
                  { name: "Clinics", value: p.clinic },
                  { name: "Pharmacies", value: p.pharmacy },
                  { name: "Schools", value: p.school },
                  { name: "Colleges", value: p.college },
                  { name: "Universities", value: p.university },
                  { name: "Gyms", value: p.gym },
                  { name: "Parks", value: p.park },
                ]}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#202B38"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={{ stroke: "#202B38" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: "#CBD5E1", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111A25",
                    border: "1px solid #202B38",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                  labelStyle={{ color: "#CBD5E1" }}
                  formatter={(value) => [
                    `${Number(value ?? 0)}`,
                    "Mapped",
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#6366F1"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recommendations */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#111A25] p-6 lg:p-7">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
              Decision Support
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Recommended opportunity directions
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              These recommendations are derived from the ward's opportunity
              category, demand, supply gap, and accessibility scores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={`${recommendation.title}-${index}`}
                icon={recommendation.icon}
                title={recommendation.title}
                text={recommendation.text}
              />
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mt-6 rounded-2xl border border-[#202B38] bg-[#0D131C] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Methodology
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                How this ward score is calculated
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The Urban Opportunity Mapper combines population demand,
                mapped amenity supply, supply gaps, and public transport
                accessibility to estimate where additional urban services
                may have stronger opportunity potential.
              </p>
            </div>

            <div className="rounded-xl border border-[#202B38] bg-[#111A25] px-5 py-4 lg:min-w-[240px]">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Model Output
              </p>
              <p className="mt-2 text-sm font-semibold text-cyan-300">
                {p.cluster}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cluster {p.cluster_id} · Rank #{p.opportunity_rank}
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[#202B38] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-600">
              Urban Opportunity Mapper
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Geospatial decision intelligence for Pune
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#202B38] bg-[#111A25] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
          >
            <ArrowLeft size={15} />
            Back to Explore Map
          </Link>
        </div>
      </div>
    </main>
  );
}