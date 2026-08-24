"use client";

import type { MasterDashboardStats } from "@/services/dashboard.service";
import DashboardSection from "./DashboardSection";
import StatCard from "./StatCard";

/* ─── Semantic Color Tokens ──────────────────────────────────── */
const INFO     = { iconColor: "#58A6FF", iconBg: "rgba(88,166,255,0.14)"  };
const ACTIVE   = { iconColor: "#23C55E", iconBg: "rgba(35,197,94,0.14)"   };
const INACTIVE = { iconColor: "#EF4444", iconBg: "rgba(239,68,68,0.14)"   };
const AMBER    = { iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.14)"  };
const VIOLET   = { iconColor: "#A78BFA", iconBg: "rgba(167,139,250,0.14)" };

/** Safe percentage calculation */
const pct = (n: number, total: number) =>
  total > 0 ? Math.round((n / total) * 100) : 0;

interface DashboardStatsProps {
  stats: MasterDashboardStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const { branches, companies, packages } = stats;

  return (
    <div className="flex flex-col gap-10">

      {/* ══════════════════════════════════════
          1. BRANCHES — 3-col uniform grid
          ══════════════════════════════════════ */}
      <DashboardSection title="Branches" description="Network branch statistics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Branches — Real breakdown donut & split bar */}
          <StatCard
            label="Total Branches"
            value={branches.total}
            breakdown={[
              { label: "Active", value: branches.active, color: "#23C55E" },
              { label: "Inactive", value: branches.inactive, color: "#EF4444" },
            ]}
            subtext={`${branches.active} Active • ${branches.inactive} Inactive`}
            {...INFO}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            }
          />
          {/* Active Branches */}
          <StatCard
            label="Active Branches"
            value={branches.active}
            percentage={pct(branches.active, branches.total)}
            subtext={`${branches.active} of ${branches.total} operational`}
            {...ACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          {/* Inactive Branches */}
          <StatCard
            label="Inactive Branches"
            value={branches.inactive}
            percentage={pct(branches.inactive, branches.total)}
            subtext={branches.inactive === 0 ? "Zero inactive branches" : `${branches.inactive} need attention`}
            {...INACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
        </div>
      </DashboardSection>

      {/* ══════════════════════════════════════
          2. COMPANIES — 2×2 / 4-col responsive grid
          ══════════════════════════════════════ */}
      <DashboardSection title="Companies" description="Registered corporate accounts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Companies — Real breakdown */}
          <StatCard
            label="Total Companies"
            value={companies.total}
            breakdown={[
              { label: "Active", value: companies.active, color: "#23C55E" },
              { label: "Inactive", value: companies.inactive, color: "#EF4444" },
            ]}
            subtext={`${companies.active} Active • ${companies.inactive} Inactive`}
            {...INFO}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            }
          />
          {/* Active Companies */}
          <StatCard
            label="Active Companies"
            value={companies.active}
            percentage={pct(companies.active, companies.total)}
            subtext={`${companies.active} of ${companies.total} accounts`}
            {...ACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          {/* Inactive Companies */}
          <StatCard
            label="Inactive Companies"
            value={companies.inactive}
            percentage={pct(companies.inactive, companies.total)}
            subtext={companies.inactive === 0 ? "All accounts active" : `${companies.inactive} suspended / inactive`}
            {...INACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
          {/* Associated Branches */}
          <StatCard
            label="Associated Branches"
            value={companies.associatedBranches}
            percentage={pct(companies.associatedBranches, branches.total || 10)}
            subtext={`Across ${branches.total} total branches`}
            {...AMBER}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            }
          />
        </div>
      </DashboardSection>

      {/* ══════════════════════════════════════════════════════════
          3. PACKAGES — Bento grid
          Row 1: [Total] [Active] [Inactive]
          Row 2: [Global ──── col-span-2 ────] [Company]
          ══════════════════════════════════════════════════════════ */}
      <DashboardSection title="Packages" description="Global and company package metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 — Total Packages with real breakdown */}
          <StatCard
            label="Total Packages"
            value={packages.total}
            breakdown={[
              { label: "Active", value: packages.active, color: "#23C55E" },
              { label: "Inactive", value: packages.inactive, color: "#EF4444" },
            ]}
            subtext={`${packages.active} Active • ${packages.inactive} Inactive`}
            {...INFO}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          {/* Active Packages */}
          <StatCard
            label="Active Packages"
            value={packages.active}
            percentage={pct(packages.active, packages.total)}
            subtext={`${packages.active} of ${packages.total} active`}
            {...ACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          {/* Inactive Packages */}
          <StatCard
            label="Inactive Packages"
            value={packages.inactive}
            percentage={pct(packages.inactive, packages.total)}
            subtext={packages.inactive === 0 ? "No inactive packages" : `${packages.inactive} disabled`}
            {...INACTIVE}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />

          {/* Row 2 — Bento: Global spans 2 cols */}
          <div className="sm:col-span-2">
            <StatCard
              label="Global Packages"
              value={packages.global}
              percentage={pct(packages.global, packages.total)}
              subtext={`${packages.global} universal templates available to all accounts`}
              {...INFO}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-15.432-4.471A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253" />
                </svg>
              }
            />
          </div>
          {/* Company Packages */}
          <StatCard
            label="Company Packages"
            value={packages.company}
            percentage={pct(packages.company, packages.total)}
            subtext={`${packages.company} custom packages bound to specific companies`}
            {...VIOLET}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            }
          />
        </div>
      </DashboardSection>

    </div>
  );
}
