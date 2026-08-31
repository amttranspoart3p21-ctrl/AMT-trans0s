"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import { useAppSelector } from "@/store/hooks";

type TabId = "global" | "company";

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

interface SearchableCompanyDropdownProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
  isDarkMode: boolean;
}

function SearchableCompanyDropdown({
  companies,
  selectedCompanyId,
  onSelect,
  isDarkMode,
}: SearchableCompanyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCompany = companies.find((c) => c.companyId === selectedCompanyId);

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      (c.branchCode && c.branchCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative shrink-0 w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border active:scale-98 ${
          isDarkMode
            ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#F0F6FC]"
            : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
          </svg>
          <span className="truncate">
            {selectedCompany
              ? `${selectedCompany.companyName} (${selectedCompany.branchCode || selectedCompany.branchName || "Main"})`
              : "All Client Companies"}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-sky-500" : isDarkMode ? "text-[#8B949E]" : "text-slate-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in select-none border max-h-72 flex flex-col ${
            isDarkMode
              ? "bg-[#18191A] border-[#30363D] text-[#F0F6FC]"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          <div className="p-1.5 border-b mb-1" style={{ borderColor: isDarkMode ? "#30363D" : "#F1F5F9" }}>
            <input
              type="text"
              placeholder="Search company or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none border transition-colors ${
                isDarkMode
                  ? "bg-[#21262D] border-[#30363D] text-[#F0F6FC] placeholder-[#8B949E] focus:border-sky-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500"
              }`}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelect("");
                setIsOpen(false);
                setSearchQuery("");
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCompanyId === ""
                  ? isDarkMode
                    ? "bg-sky-950/60 text-sky-300 font-extrabold"
                    : "bg-sky-50 text-sky-700 font-extrabold"
                  : isDarkMode
                  ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>All Client Companies</span>
              {selectedCompanyId === "" && (
                <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {filteredCompanies.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                No matching company found
              </div>
            ) : (
              filteredCompanies.map((c) => {
                const isSelected = selectedCompanyId === c.companyId;
                return (
                  <button
                    key={c.companyId}
                    type="button"
                    onClick={() => {
                      onSelect(c.companyId);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? "bg-sky-950/60 text-sky-300 font-extrabold"
                          : "bg-sky-50 text-sky-700 font-extrabold"
                        : isDarkMode
                        ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{c.companyName}</span>
                      {c.branchCode && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                          {c.branchCode}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RouteRatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get("tab") as TabId) || "global");

  const [displayPackages, setDisplayPackages] = useState<Package[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [globalRatesMap, setGlobalRatesMap] = useState<Record<string, number>>({});
  const [companyRatesMap, setCompanyRatesMap] = useState<Record<string, number>>({});

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("companyId") || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pkgId = searchParams.get("packageId");
    if (pkgId) {
      fetch(`/api/packages/${pkgId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.packageName) {
            setSearchInput(data.packageName);
            setSearch(data.packageName);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (json.companies && Array.isArray(json.companies)) {
          setCompanies(json.companies);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }
    loadCompanies();
  }, []);

  const loadRouteRatesCounts = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        fetch("/api/global-route-rates"),
        fetch("/api/company-route-rates"),
      ]);
      const gJson = await gRes.json();
      const cJson = await cRes.json();

      if (gJson.routeRates && Array.isArray(gJson.routeRates)) {
        const map: Record<string, number> = {};
        gJson.routeRates.forEach((r: GlobalRouteRate) => {
          map[r.packageId] = (map[r.packageId] || 0) + 1;
        });
        setGlobalRatesMap(map);
      }

      if (cJson.companyRouteRates && Array.isArray(cJson.companyRouteRates)) {
        const map: Record<string, number> = {};
        cJson.companyRouteRates.forEach((r: CompanyRouteRate) => {
          if (r.packageId) {
            const pkgId = r.packageId.trim();
            if (r.companyId) {
              const compKey = `${r.companyId.trim()}_${pkgId}`;
              map[compKey] = (map[compKey] || 0) + 1;
            }
            map[pkgId] = (map[pkgId] || 0) + 1;
          }
        });
        setCompanyRatesMap(map);
      }
    } catch (err) {
      console.error("Failed to load route rates counts:", err);
    }
  }, []);

  useEffect(() => {
    loadRouteRatesCounts();
  }, [loadRouteRatesCounts]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/packages");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch packages.");

      const allPkgs: Package[] = json.packages || [];

      let scopeFiltered = allPkgs.filter((p) => {
        if (activeTab === "global") {
          return !p.companyId;
        } else {
          return !!p.companyId;
        }
      });

      if (activeTab === "company" && companyFilter.trim()) {
        scopeFiltered = scopeFiltered.filter((p) => p.companyId === companyFilter.trim());
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        scopeFiltered = scopeFiltered.filter((p) => p.packageName.toLowerCase().includes(q));
      }

      const totalRecs = scopeFiltered.length;
      const lm = pagination.limit;
      const totalPgs = Math.ceil(totalRecs / lm) || 1;
      const validPage = Math.min(Math.max(1, pagination.page), totalPgs);
      const start = (validPage - 1) * lm;
      const paginatedSlice = scopeFiltered.slice(start, start + lm);

      setDisplayPackages(paginatedSlice);
      setPagination((prev) => ({
        ...prev,
        page: validPage,
        totalRecords: totalRecs,
        totalPages: totalPgs,
      }));
    } catch (err) {
      console.error("Failed to load packages for route rates:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, companyFilter, activeTab]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeTab, companyFilter]);

  return (
    <Layout>
      <div
        className="h-full flex-1 flex flex-col p-5 md:p-6 w-full mx-auto relative select-none overflow-hidden transition-colors duration-300"
        style={isDarkMode ? { background: "#18191A" } : { background: "#F0F7FF" }}
      >
        <div className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 self-start md:self-auto">
            {(
              [
                {
                  id: "global" as TabId,
                  label: "Global Route Rates",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                    </svg>
                  ),
                },
                {
                  id: "company" as TabId,
                  label: "Company Route Rates",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                    </svg>
                  ),
                },
              ]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-sky-600 dark:bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 border border-transparent"
                  }`}
                  title={`Switch to ${tab.label}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-52 sm:w-64">
              <Input
                placeholder="Search package name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                icon={
                  <svg className="h-4 w-4 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            </div>

            {activeTab === "company" && (
              <SearchableCompanyDropdown
                companies={companies}
                selectedCompanyId={companyFilter}
                onSelect={(cId) => setCompanyFilter(cId)}
                isDarkMode={isDarkMode}
              />
            )}

            <button
              type="button"
              onClick={() => router.push("/packages")}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95"
            >
              <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span>Package Catalogue</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                Loading route rate packages...
              </p>
            </div>
          )}

          {!loading && displayPackages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-sm font-semibold">
                {search || (activeTab === "company" && companyFilter)
                  ? `No ${activeTab === "global" ? "global" : "company"} packages found matching your criteria.`
                  : `No ${activeTab === "global" ? "global" : "company"} packages available yet.`}
              </p>
              {search || (activeTab === "company" && companyFilter) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setCompanyFilter("");
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/packages")}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Configure New Package
                </button>
              )}
            </div>
          )}

          {!loading && displayPackages.length > 0 && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayPackages.map((pkg) => {
                    const count =
                      activeTab === "global"
                        ? globalRatesMap[pkg.packageId] || 0
                        : pkg.companyId
                        ? companyRatesMap[`${pkg.companyId.trim()}_${pkg.packageId.trim()}`] || 0
                        : 0;

                    const targetPath =
                      activeTab === "global"
                        ? `/global-route-rates/manage/${pkg.packageId}`
                        : `/global-route-rates/company/manage/${pkg.packageId}`;

                    return (
                      <div
                        key={pkg.packageId}
                        onClick={() => router.push(targetPath)}
                        className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#242526] p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-md transition-all duration-200 group cursor-pointer select-none"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {pkg.packageName}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {activeTab === "global" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/40">
                                    GLOBAL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                                    COMPANY
                                  </span>
                                )}

                                {pkg.companyId && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800">
                                    {(() => {
                                      const comp = companies.find((c) => c.companyId === pkg.companyId);
                                      return comp
                                        ? `${comp.companyName} (${comp.branchCode || comp.branchName || "Branch"})`
                                        : (pkg.companyName || "Client Rate");
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              pkg.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pkg.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {pkg.status || "Active"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 pt-1">
                          <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {pkg.description || "Universal transport cargo package type for tariff calculation."}
                          </p>

                          <div className="grid grid-cols-2 gap-2 select-none">
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                Configured Routes
                              </span>
                              <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                                {count} Routes
                              </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                Pricing Engine
                              </span>
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                Ready
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                            ID: {pkg.packageId}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                            <span>Manage Rates</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="shrink-0 pt-2.5 pb-1 border-t"
                style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}
              >
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(newPage) => {
                    setPagination((prev) => ({ ...prev, page: newPage }));
                  }}
                  limit={pagination.limit}
                  onLimitChange={(newLimit) => {
                    setPagination((prev) => ({ ...prev, page: 1, limit: newLimit }));
                  }}
                  totalRecords={pagination.totalRecords}
                  limitOptions={[9, 18, 27, 45, 90]}
                  entityName="packages"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
