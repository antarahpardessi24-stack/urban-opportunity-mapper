import {
  Activity,
  Bus,
  MapPin,
  Users,
  X,
} from "lucide-react";

import type { ReactNode } from "react";

import type { WardFeature } from "../types/ward";

interface WardIntelligencePanelProps {
  ward: WardFeature | null;
  onClose: () => void;
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

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
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

function getLevelLabel(
  level: string
): string {
  if (level === "High") {
    return "High Opportunity";
  }

  if (
    level === "Medium" ||
    level === "Moderate"
  ) {
    return "Moderate Opportunity";
  }

  return "Lower Opportunity";
}

export default function WardIntelligencePanel({
  ward,
  onClose,
}: WardIntelligencePanelProps) {
  if (!ward) {
    return null;
  }

  const p = ward.properties;

  return (
    <aside className="absolute right-4 top-4 z-30 w-[360px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0D131C]/95 shadow-2xl backdrop-blur-xl">

      {/* HEADER */}

      <div className="border-b border-slate-800 px-5 py-4">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400">

              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

              Ward Intelligence

            </div>

            <h2 className="mt-2 text-xl font-bold text-white">
              Ward {p.ward_id}
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-400">
              {p.Name1}
            </p>

            <p className="text-xs text-slate-500">
              {p.Name2}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ward intelligence"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X size={16} />
          </button>

        </div>

      </div>

      {/* OPPORTUNITY SCORE */}

      <div className="border-b border-slate-800 px-5 py-5">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Opportunity Score
            </p>

            <div className="mt-2 flex items-baseline gap-2">

              <span className="text-4xl font-bold tracking-tight text-cyan-400">
                {formatScore(
                  p.opportunity_score
                )}
              </span>

              <span className="text-sm text-slate-500">
                / 100
              </span>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              {getLevelLabel(
                p.opportunity_level
              )}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              City Rank
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              #{p.opportunity_rank}
            </p>

            <p className="text-xs text-slate-500">
              of 58 wards
            </p>

          </div>

        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
            style={{
              width: `${Math.min(
                Math.max(
                  p.opportunity_score,
                  0
                ),
                100
              )}%`,
            }}
          />

        </div>

      </div>

      {/* CLASSIFICATION */}

      <div className="grid grid-cols-2 gap-3 border-b border-slate-800 p-5">

        {/* OPPORTUNITY */}

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">

          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Opportunity
          </p>

          <div className="mt-2 flex items-center gap-2">

            <Activity
              size={16}
              className="text-cyan-400"
            />

            <span className="text-sm font-semibold text-cyan-300">
              {p.opportunity_category}
            </span>

          </div>

        </div>

        {/* LEVEL */}

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">

          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Level
          </p>

          <p className="mt-2 text-sm font-semibold text-indigo-300">
            {p.opportunity_level}
          </p>

        </div>

        {/* ML CLUSTER */}

        <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">

          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
            ML Cluster
          </p>

          <div className="mt-2 flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />

            <span className="text-sm font-semibold text-slate-200">
              {p.cluster ?? "Unclassified"}
            </span>

          </div>

        </div>

      </div>

      {/* CORE INDICATORS */}

      <div className="px-5 py-5">

        <div className="mb-3 flex items-center gap-2">

          <Activity
            size={16}
            className="text-cyan-400"
          />

          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Core Indicators
          </h3>

        </div>

        <div className="grid grid-cols-2 gap-3">

          {/* POPULATION */}

          <MetricCard
            icon={
              <Users size={14} />
            }
            label="Population"
            value={formatNumber(
              p.population
            )}
          />

          {/* DENSITY */}

          <MetricCard
            icon={
              <MapPin size={14} />
            }
            label="Density"
            value={`${formatNumber(
              p.population_density_per_km2
            )}/km²`}
          />

          {/* DEMAND */}

          <MetricCard
            label="Demand"
            value={formatScore(
              p.demand_score
            )}
          />

          {/* SUPPLY GAP */}

          <MetricCard
            label="Supply Gap"
            value={formatScore(
              p.supply_gap_score
            )}
          />

          {/* ACCESSIBILITY */}

          <MetricCard
            label="Accessibility"
            value={formatScore(
              p.accessibility_score
            )}
          />

          {/* PMPML */}

          <MetricCard
            icon={
              <Bus size={14} />
            }
            label="PMPML Stops"
            value={formatNumber(
              p.pmpml_stops
            )}
          />

        </div>

      </div>

    </aside>
  );
}

/* ============================================================
   METRIC CARD
   ============================================================ */

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string;
}

function MetricCard({
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

      <div className="flex items-center gap-2 text-slate-500">

        {icon}

        <span className="text-[9px] uppercase tracking-[0.16em]">
          {label}
        </span>

      </div>

      <p className="mt-2 text-lg font-bold text-white">
        {value}
      </p>

    </div>
  );
}