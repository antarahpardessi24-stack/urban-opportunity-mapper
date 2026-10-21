
import { BrowserRouter, Route, Routes, Navigate, Link } from "react-router-dom";
import {
  ArrowRight,
  MapPinned,
  ChartNoAxesCombined,
  Activity,
  Layers3,
  Bus,
  Building2,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  MoveUpRight,
} from "lucide-react";

import Explore from "./pages/Explore";
import WardDetails from "./pages/WardDetails";
import Analytics from "./pages/Analytics";

const features = [
  {
    number: "01",
    title: "Opportunity Scoring",
    description:
      "Identify neighbourhoods with high potential for new services and urban development.",
    icon: ChartNoAxesCombined,
    tag: "Spatial intelligence",
  },
  {
    number: "02",
    title: "Demand vs Supply",
    description:
      "Compare population demand with mapped amenities to uncover potential service gaps.",
    icon: Activity,
    tag: "Gap analysis",
  },
  {
    number: "03",
    title: "Accessibility Analysis",
    description:
      "Explore how public transport and nearby amenities connect residents to essential services.",
    icon: Bus,
    tag: "Urban mobility",
  },
  {
    number: "04",
    title: "ML Ward Clustering",
    description:
      "Group neighbourhoods by their opportunity characteristics to support data-driven planning.",
    icon: BrainCircuit,
    tag: "Machine learning",
  },
];

function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#070B12] text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
          <Link to="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 sm:h-10 sm:w-10">
              <MapPinned className="h-5 w-5 text-cyan-400" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold leading-4 tracking-[0.1em] text-white sm:text-xs sm:tracking-[0.16em]">
                URBAN OPPORTUNITY
              </p>
              <p className="text-[10px] tracking-[0.18em] text-cyan-400 sm:text-xs sm:tracking-[0.2em]">
                MAPPER
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/analytics"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:text-cyan-300 sm:inline-flex"
            >
              Analytics
            </Link>

            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/40 px-2.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Explore Map
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(34,211,238,0.13),transparent_58%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-28">
          <div className="min-w-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-cyan-300 sm:mb-7 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Geospatial Intelligence Platform</span>
            </div>

            <p className="text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-slate-500 sm:text-xs sm:tracking-[0.3em]">
              UNDERSTANDING THE CITY THROUGH DATA
            </p>

            <h1 className="mt-5 break-words text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Discover Pune&apos;s
              <span className="mt-2 block text-cyan-400">
                Hidden Opportunities.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:mt-7 sm:text-lg sm:leading-8">
              Explore population demand, amenity distribution, transport
              accessibility and underserved neighbourhoods through
              data-driven spatial intelligence.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">
              <Link
                to="/explore"
                className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-center text-sm font-bold text-[#061018] transition hover:bg-cyan-300 sm:w-auto sm:px-6 sm:py-4 sm:text-base"
              >
                Open Intelligence Map
                <ArrowRight className="h-5 w-5 shrink-0" />
              </Link>

              <Link
                to="/analytics"
                className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-300 sm:w-auto sm:px-6 sm:py-4 sm:text-base"
              >
                Explore Analytics
                <ChartNoAxesCombined className="h-5 w-5 shrink-0" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500 sm:mt-9 sm:gap-x-6">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
                Data-driven analysis
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers3 className="h-4 w-4 shrink-0 text-cyan-400" />
                Geospatial mapping
              </span>
            </div>
          </div>

          {/* Intelligence preview */}
          <div className="relative mx-auto w-full min-w-0 max-w-xl">
            <div className="absolute -inset-3 rounded-[2rem] bg-cyan-400/5 blur-2xl sm:-inset-5" />

            <div className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-[#0D131C] shadow-2xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Pune Intelligence</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Urban opportunity overview
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5 text-[10px] text-emerald-300 sm:px-3 sm:text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Project data
                </span>
              </div>

              <div className="relative overflow-hidden bg-[#0A111B] p-3 sm:p-5 sm:p-7">
                <svg
                  viewBox="0 0 440 340"
                  role="img"
                  aria-label="Illustrative ward grid for geospatial analysis"
                  className="block h-auto w-full"
                >
                  <defs>
                    <pattern
                      id="mapGrid"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 24 0 L 0 0 0 24"
                        fill="none"
                        stroke="#263747"
                        strokeWidth="0.8"
                      />
                    </pattern>
                    <linearGradient
                      id="wardGlow"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.48" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  <rect width="440" height="340" fill="url(#mapGrid)" />

                  <g stroke="#314456" strokeWidth="1.2">
                    <path d="M30 35 L115 24 L143 65 L108 111 L37 101 Z" fill="#142A38" />
                    <path d="M115 24 L205 34 L214 91 L143 65 Z" fill="url(#wardGlow)" />
                    <path d="M205 34 L298 22 L320 78 L214 91 Z" fill="#173445" />
                    <path d="M298 22 L400 42 L386 112 L320 78 Z" fill="#16303D" />
                    <path d="M37 101 L108 111 L126 169 L53 190 L22 145 Z" fill="#193B4A" />
                    <path d="M108 111 L214 91 L230 154 L126 169 Z" fill="#14536A" />
                    <path d="M214 91 L320 78 L327 153 L230 154 Z" fill="url(#wardGlow)" />
                    <path d="M320 78 L386 112 L406 181 L327 153 Z" fill="#173445" />
                    <path d="M53 190 L126 169 L154 245 L69 264 L30 227 Z" fill="#163443" />
                    <path d="M126 169 L230 154 L235 224 L154 245 Z" fill="#15495C" />
                    <path d="M230 154 L327 153 L340 231 L235 224 Z" fill="#176078" />
                    <path d="M327 153 L406 181 L394 258 L340 231 Z" fill="#1B3948" />
                    <path d="M69 264 L154 245 L176 307 L92 320 Z" fill="#183342" />
                    <path d="M154 245 L235 224 L258 305 L176 307 Z" fill="#17495B" />
                    <path d="M235 224 L340 231 L355 305 L258 305 Z" fill="url(#wardGlow)" />
                    <path d="M340 231 L394 258 L412 315 L355 305 Z" fill="#193645" />
                  </g>

                  <g
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 218 L77 199 L119 206 L163 174 L204 180 L249 130 L292 139 L333 104 L422 116" />
                    <path d="M79 15 L94 77 L86 128 L112 175 L105 220 L131 279 L151 330" strokeOpacity="0.55" />
                  </g>

                  <g fill="#22D3EE" stroke="#07111A" strokeWidth="3">
                    <circle cx="119" cy="206" r="5" />
                    <circle cx="204" cy="180" r="5" />
                    <circle cx="249" cy="130" r="5" />
                    <circle cx="333" cy="104" r="5" />
                    <circle cx="292" cy="139" r="5" />
                  </g>

                  <g fill="#A5F3FC" fontSize="10" fontWeight="600">
                    <text x="145" y="47">WARD 03</text>
                    <text x="255" y="55">WARD 04</text>
                    <text x="145" y="137">WARD 13</text>
                    <text x="245" y="194">WARD 21</text>
                    <text x="265" y="272">WARD 46</text>
                  </g>

                  <g transform="translate(287 8)">
                    <rect
                      width="135"
                      height="36"
                      rx="8"
                      fill="#0D1924"
                      stroke="#244454"
                    />
                    <circle cx="14" cy="18" r="4" fill="#22D3EE" />
                    <text
                      x="25"
                      y="22"
                      fill="#D7EAF2"
                      fontSize="10"
                      fontWeight="600"
                    >
                      Spatial analysis
                    </text>
                  </g>
                </svg>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3 border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                    Ward boundaries
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                    Opportunity indicators
                  </span>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-slate-600">
                  Illustrative preview — open the intelligence map to explore
                  the actual ward data.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-slate-700 bg-[#111A25] p-4 shadow-xl sm:block">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Analytical coverage
              </p>
              <p className="mt-1 text-2xl font-bold text-cyan-400">58 wards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project metrics */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Analytical wards"
            value="58"
            description="Ward-level spatial analysis"
            icon={<MapPinned className="h-5 w-5 text-cyan-400" />}
          />
          <MetricCard
            label="Mapped amenities"
            value="4,444"
            description="Cleaned points of interest"
            icon={<Building2 className="h-5 w-5 text-cyan-400" />}
          />
          <MetricCard
            label="Analysis approach"
            value="AI + GIS"
            description="Spatial analytics and clustering"
            icon={<BrainCircuit className="h-5 w-5 text-cyan-400" />}
          />
        </div>
      </section>

      {/* Feature showcase */}
      <section className="border-y border-slate-800/80 bg-[#0A1019]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                WHAT YOU CAN EXPLORE
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-4xl">
                Intelligence beyond the map.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Explore the analytical capabilities used to understand
                neighbourhood needs and urban service opportunities.
              </p>
            </div>

            <Link
              to="/analytics"
              className="inline-flex w-fit shrink-0 items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View Analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.number}
                  className="group min-w-0 rounded-2xl border border-slate-800 bg-[#0D131C] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-[#101B27] sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-xs font-semibold tracking-widest text-slate-600">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold">{feature.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-800 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      {feature.tag}
                    </span>
                    <MoveUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-cyan-300" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#0D1721] px-5 py-10 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_65%)]" />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              EXPLORE THE CITY DIFFERENTLY
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold leading-tight sm:text-4xl">
              Find the gaps. Understand the opportunity.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Discover how spatial data can support better-informed urban
              planning decisions across Pune.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/explore"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-[#061018] transition hover:bg-cyan-300 sm:w-auto sm:px-6"
              >
                Explore the Map
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/analytics"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-300 sm:w-auto sm:px-6"
              >
                Open Analytics
                <ChartNoAxesCombined className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-[10px] leading-5 text-slate-500 sm:px-6 sm:text-xs lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© Urban Opportunity Mapper · Pune, India</p>
          <p className="break-words">
            GEOSPATIAL ANALYTICS · URBAN INTELLIGENCE · DATA-DRIVEN PLANNING
          </p>
        </div>
      </footer>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#0D131C] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        {icon}
      </div>
      <p className="mt-4 break-words text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/app/ward/:id" element={<WardDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
