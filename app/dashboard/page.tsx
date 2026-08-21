"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import type { MasterDashboardStats } from "@/services/dashboard.service";

/* ============================================================
   StatCard Component
   ============================================================ */

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgGlow: string;
}

function StatCard({ label, value, icon, color, bgGlow }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 group hover:border-slate-700 transition-all duration-300">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${bgGlow}`} />
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0 shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Master Dashboard Page Component
   ============================================================ */

export default function MasterDashboardPage() {
  const [stats, setStats] = useState<MasterDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to fetch dashboard stats (${res.status})`);
      }
      setStats(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-6 w-full mx-auto relative select-none gap-8">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              MASTER DASHBOARD
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-sm">
              Master data overview
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDashboardStats} disabled={loading}>
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Data
          </Button>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold text-slate-400">Loading master dashboard statistics...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
            <svg className="h-10 w-10 text-rose-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-rose-300 text-sm font-semibold">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={fetchDashboardStats}>
              Retry Loading Dashboard
            </Button>
          </div>
        )}

        {/* Stats Dashboard View */}
        {stats && !loading && (
          <div className="flex flex-col gap-10">
            {/* ====================================
                1. BRANCHES SUMMARY
                ==================================== */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-400">
                  Branches
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-xs font-medium text-slate-500">
                  Network branch statistics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="TOTAL BRANCHES"
                  value={stats.branches.total}
                  color="bg-violet-600/20 text-violet-400"
                  bgGlow="bg-violet-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  }
                />
                <StatCard
                  label="ACTIVE BRANCHES"
                  value={stats.branches.active}
                  color="bg-emerald-600/20 text-emerald-400"
                  bgGlow="bg-emerald-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="INACTIVE BRANCHES"
                  value={stats.branches.inactive}
                  color="bg-rose-600/20 text-rose-400"
                  bgGlow="bg-rose-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* ====================================
                2. COMPANIES SUMMARY
                ==================================== */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-400">
                  Companies
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-xs font-medium text-slate-500">
                  Registered corporate accounts
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="TOTAL COMPANIES"
                  value={stats.companies.total}
                  color="bg-violet-600/20 text-violet-400"
                  bgGlow="bg-violet-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  }
                />
                <StatCard
                  label="ACTIVE COMPANIES"
                  value={stats.companies.active}
                  color="bg-emerald-600/20 text-emerald-400"
                  bgGlow="bg-emerald-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="INACTIVE COMPANIES"
                  value={stats.companies.inactive}
                  color="bg-rose-600/20 text-rose-400"
                  bgGlow="bg-rose-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  }
                />
                <StatCard
                  label="ASSOCIATED BRANCHES"
                  value={stats.companies.associatedBranches}
                  color="bg-amber-600/20 text-amber-400"
                  bgGlow="bg-amber-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  }
                />
              </div>
            </section>

            {/* ====================================
                3. PACKAGES SUMMARY
                ==================================== */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-violet-400">
                  Packages
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-xs font-medium text-slate-500">
                  Global and company package metrics
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                  label="TOTAL PACKAGES"
                  value={stats.packages.total}
                  color="bg-violet-600/20 text-violet-400"
                  bgGlow="bg-violet-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
                <StatCard
                  label="ACTIVE PACKAGES"
                  value={stats.packages.active}
                  color="bg-emerald-600/20 text-emerald-400"
                  bgGlow="bg-emerald-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="INACTIVE PACKAGES"
                  value={stats.packages.inactive}
                  color="bg-rose-600/20 text-rose-400"
                  bgGlow="bg-rose-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  }
                />
                <StatCard
                  label="GLOBAL PACKAGES"
                  value={stats.packages.global}
                  color="bg-sky-600/20 text-sky-400"
                  bgGlow="bg-sky-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-15.432-4.471A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253" />
                    </svg>
                  }
                />
                <StatCard
                  label="COMPANY PACKAGES"
                  value={stats.packages.company}
                  color="bg-indigo-600/20 text-indigo-400"
                  bgGlow="bg-indigo-500"
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  }
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
