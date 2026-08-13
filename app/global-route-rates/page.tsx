"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import type { CompanyRouteRate } from "@/types/company-route-rate";

type TabId = "global" | "company";

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

/* ============================================================
   Searchable Company Dropdown Filter Component
   ============================================================ */

interface SearchableCompanyDropdownProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
}

function SearchableCompanyDropdown({
  companies,
  selectedCompanyId,
  onSelect,
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
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 cursor-pointer"
      >
        <span className="truncate font-medium">
          {selectedCompany
            ? `${selectedCompany.companyName} (${selectedCompany.branchCode || selectedCompany.branchName})`
            : "All Companies"}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-64">
          <div className="p-2 border-b border-slate-800 bg-slate-950/50">
            <input
              type="text"
              placeholder="Search company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-lg px-3 py-1.5 outline-none bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-violet-500"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 p-1">
            <button
              type="button"
              onClick={() => {
                onSelect("");
                setIsOpen(false);
                setSearchQuery("");
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedCompanyId === ""
                  ? "bg-violet-600/20 text-violet-300 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              All Companies
            </button>

            {filteredCompanies.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching company found
              </div>
            ) : (
              filteredCompanies.map((c) => (
                <button
                  key={c.companyId}
                  type="button"
                  onClick={() => {
                    onSelect(c.companyId);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCompanyId === c.companyId
                      ? "bg-violet-600/20 text-violet-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{c.companyName}</span>
                  {c.branchCode && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 ml-2">
                      {c.branchCode}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Main Route Rates Page Component
   ============================================================ */

export default function RouteRatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Initialize search from packageId
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
  const [loading, setLoading] = useState(false);

  /* ============================================================
     API Calls
     ============================================================ */

  // Load Companies
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

  // Load Route Rates Counts Map
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

  // Fetch all packages and apply scope filtering & pagination
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      // Do NOT pass page or limit to /api/packages so we receive ALL package records
      const res = await fetch("/api/packages");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch packages.");

      const allPkgs: Package[] = json.packages || [];

      // Step 1: Filter by Scope (Global vs Company)
      let scopeFiltered = allPkgs.filter((p) => {
        if (activeTab === "global") {
          return !p.companyId; // GLOBAL package (no companyId)
        } else {
          return !!p.companyId; // COMPANY package (has companyId)
        }
      });

      // Step 2: Filter by selected Company (only for Company tab)
      if (activeTab === "company" && companyFilter.trim()) {
        scopeFiltered = scopeFiltered.filter((p) => p.companyId === companyFilter.trim());
      }

      // Step 3: Filter by package name Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        scopeFiltered = scopeFiltered.filter((p) => p.packageName.toLowerCase().includes(q));
      }

      // Step 4: Calculate totals and paginate
      const totalRecs = scopeFiltered.length;
      const lm = pagination.limit;
      const totalPgs = Math.ceil(totalRecs / lm) || 1;

      // Adjust current page if out of bounds
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

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset page when tab or companyFilter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeTab, companyFilter]);

  /* ============================================================
     Render
     ============================================================ */

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-6 w-full mx-auto relative">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
              <span className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
                🗺
              </span>
              TMS Route Rates Management
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Configure and manage transport rates, pickup, and delivery charges across branches
            </p>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 mb-8 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("global")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "global"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🌐 Global Route Rates
            {activeTab === "global" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("company")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "company"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🏢 Company Route Rates
            {activeTab === "company" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Toolbar Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-6">
          <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by package name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 placeholder-slate-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Company Filter (Only for Company Tab) */}
            {activeTab === "company" && (
              <SearchableCompanyDropdown
                companies={companies}
                selectedCompanyId={companyFilter}
                onSelect={(cId) => setCompanyFilter(cId)}
              />
            )}
          </div>
        </div>

        {/* Loading Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between"
              >
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
                <div className="h-8 bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displayPackages.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-4xl mb-3">{activeTab === "global" ? "🌐" : "🏢"}</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              No {activeTab === "global" ? "Global" : "Company"} Packages Found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {search || companyFilter
                ? "No matching packages found. Try clearing your search or filter."
                : `No ${activeTab === "global" ? "global" : "company"} packages have been added yet.`}
            </p>
          </div>
        ) : (
          /* Packages Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayPackages.map((pkg) => {
                const count = activeTab === "global"
                  ? (globalRatesMap[pkg.packageId] || 0)
                  : (pkg.companyId ? (companyRatesMap[`${pkg.companyId.trim()}_${pkg.packageId.trim()}`] || 0) : 0);

                const targetPath = activeTab === "global"
                  ? `/global-route-rates/manage/${pkg.packageId}`
                  : `/global-route-rates/company/manage/${pkg.packageId}`;

                return (
                  <div
                    key={pkg.packageId}
                    onClick={() => router.push(targetPath)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:border-violet-500/50 hover:bg-slate-850 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide group-hover:text-violet-400 transition-colors">
                            {pkg.packageName}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                            ID: {pkg.packageId}
                          </span>
                        </div>

                        {/* Scope Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                            activeTab === "global"
                              ? "bg-violet-950/60 border-violet-500/30 text-violet-400"
                              : "bg-amber-950/60 border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {activeTab === "global" ? "GLOBAL" : "COMPANY"}
                        </span>
                      </div>

                      {/* Company Name Tag if Company Package */}
                      {pkg.companyId && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                            🏢 {(() => {
                                const comp = companies.find(c => c.companyId === pkg.companyId);
                                return comp ? `${comp.companyName} - ${comp.branchCode || comp.branchName}` : (pkg.companyName || "Company Package");
                              })()}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {pkg.description || "No description provided."}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-4 mt-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Configured Routes:{" "}
                        <strong className="text-violet-400 font-mono font-black">{count}</strong>
                      </span>

                      <span className="text-xs font-bold text-violet-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Manage Routes →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reusable Pagination Component */}
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
