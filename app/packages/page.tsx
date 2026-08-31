"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";
import { useAppSelector } from "@/store/hooks";
import StatCard from "@/app/dashboard/_components/StatCard";
import DashboardSection from "@/app/dashboard/_components/DashboardSection";

/* ─── Semantic Color Tokens ──────────────────────────────────── */
const INFO     = { iconColor: "#58A6FF", iconBg: "rgba(88,166,255,0.14)"  };
const ACTIVE   = { iconColor: "#23C55E", iconBg: "rgba(35,197,94,0.14)"   };
const INACTIVE = { iconColor: "#EF4444", iconBg: "rgba(239,68,68,0.14)"   };
const VIOLET   = { iconColor: "#A78BFA", iconBg: "rgba(167,139,250,0.14)" };
const AMBER    = { iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.14)"  };

/* ─── Status Filter Options ──────────────────────────────────── */
const STATUS_FILTER_OPTIONS: Array<{
  value: "All" | "Active" | "Inactive";
  label: string;
  dotColor: string;
}> = [
  { value: "All", label: "All Status", dotColor: "bg-sky-500" },
  { value: "Active", label: "Active Only", dotColor: "bg-emerald-500" },
  { value: "Inactive", label: "Inactive Only", dotColor: "bg-rose-500" },
];

/* ============================================================
   Types
   ============================================================ */

interface PackageStats {
  totalPackages: number;
  activePackages: number;
  inactivePackages: number;
  globalPackages: number;
  companyPackages: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

type TabId = "dashboard" | "management";
type PackageScopeCategory = "GLOBAL" | "COMPANY";

interface PackageFormData {
  packageName: string;
  scope: PackageScopeCategory;
  companyId: string;
  description: string;
  status: "Active" | "Inactive";
}

const emptyForm: PackageFormData = {
  packageName: "",
  scope: "GLOBAL",
  companyId: "",
  description: "",
  status: "Active",
};

/* ============================================================
   Searchable Company Dropdown Component
   ============================================================ */

interface SearchableCompanyDropdownProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelect: (companyId: string) => void;
  allowAll?: boolean;
  label?: string;
  required?: boolean;
  isDarkMode: boolean;
}

function SearchableCompanyDropdown({
  companies,
  selectedCompanyId,
  onSelect,
  allowAll = false,
  label,
  required = false,
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
      (c.branchCode && c.branchCode.toLowerCase().includes(q)) ||
      (c.displayName && c.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-1.5 w-full relative shrink-0" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
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
            {selectedCompanyId === "GLOBAL"
              ? "Global Packages Only"
              : selectedCompany
              ? `${selectedCompany.companyName} (${selectedCompany.branchCode || selectedCompany.branchName || "Main"})`
              : allowAll
              ? "All Packages"
              : "-- Select Company --"}
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
            {allowAll && (
              <>
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
                  <span>All Packages</span>
                  {selectedCompanyId === "" && (
                    <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelect("GLOBAL");
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCompanyId === "GLOBAL"
                      ? isDarkMode
                        ? "bg-sky-950/60 text-sky-300 font-extrabold"
                        : "bg-sky-50 text-sky-700 font-extrabold"
                      : isDarkMode
                      ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                      GLOBAL
                    </span>
                    <span>Global Packages Only</span>
                  </div>
                  {selectedCompanyId === "GLOBAL" && (
                    <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </>
            )}

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

/* ============================================================
   Package Form Component (Create vs Edit Rules)
   ============================================================ */

interface PackageFormProps {
  isEdit: boolean;
  formData: PackageFormData;
  formErrors: string[];
  companies: Company[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof PackageFormData) => void;
  onSelectCompany: (companyId: string) => void;
  onScopeChange: (scope: PackageScopeCategory) => void;
  onStatusChange: (status: "Active" | "Inactive") => void;
  isDarkMode: boolean;
}

function PackageForm({
  isEdit,
  formData,
  formErrors,
  companies,
  onChange,
  onSelectCompany,
  onScopeChange,
  onStatusChange,
  isDarkMode,
}: PackageFormProps) {
  return (
    <div className="flex flex-col gap-5 py-1 select-none">
      {/* Error Alert Box */}
      {formErrors.length > 0 && (
        <div
          className="rounded-xl p-3 text-xs font-semibold flex flex-col gap-1 border"
          style={
            isDarkMode
              ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#FCA5A5" }
              : { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }
          }
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>Please resolve the following:</span>
          </div>
          <div className="pl-5 flex flex-col gap-0.5">
            {formErrors.map((err, i) => (
              <span key={i}>• {err}</span>
            ))}
          </div>
        </div>
      )}

      {/* Group 1: Classification & Scope */}
      <div
        className="rounded-2xl p-4 border flex flex-col gap-4"
        style={
          isDarkMode
            ? { background: "#1C1D1E", borderColor: "#2D3139" }
            : { background: "#F8FAFC", borderColor: "#E2E8F0" }
        }
      >
        <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: isDarkMode ? "#2D3139" : "#E2E8F0" }}>
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
            Package Classification & Scope
          </h4>
        </div>

        {/* Scope Switch: ONLY VISIBLE DURING CREATE */}
        {!isEdit ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Package Scope Type
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#121314] border border-slate-200 dark:border-zinc-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => onScopeChange("GLOBAL")}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formData.scope === "GLOBAL"
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                GLOBAL PACKAGE
              </button>

              <button
                type="button"
                onClick={() => onScopeChange("COMPANY")}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formData.scope === "COMPANY"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                COMPANY PACKAGE
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Package Scope:
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                formData.scope === "GLOBAL"
                  ? "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-300"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"
              }`}
            >
              {formData.scope} PACKAGE
            </span>
          </div>
        )}

        {/* Company Selection: ONLY SHOW IF SCOPE IS COMPANY */}
        {formData.scope === "COMPANY" && (
          <SearchableCompanyDropdown
            companies={companies}
            selectedCompanyId={formData.companyId}
            onSelect={onSelectCompany}
            label="Associated Client Company"
            required
            isDarkMode={isDarkMode}
          />
        )}

        {/* Status Switcher */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            Operational Status
          </label>
          <div className="flex items-center gap-3">
            {(["Active", "Inactive"] as const).map((s) => {
              const isSelected = formData.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? s === "Active"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : isDarkMode
                      ? "bg-[#121314] hover:bg-[#252627] text-zinc-400 border-zinc-800"
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : s === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group 2: Package Details */}
      <div
        className="rounded-2xl p-4 border flex flex-col gap-4"
        style={
          isDarkMode
            ? { background: "#1C1D1E", borderColor: "#2D3139" }
            : { background: "#F8FAFC", borderColor: "#E2E8F0" }
        }
      >
        <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: isDarkMode ? "#2D3139" : "#E2E8F0" }}>
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
            Package Attributes & Notes
          </h4>
        </div>

        <Input
          label="Package Name *"
          placeholder="e.g. 4x4 Carton Box, Heavy Roll, Wooden Crate"
          value={formData.packageName}
          onChange={(e) => onChange(e, "packageName")}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Standard cardboard packaging for lightweight cargo"
          value={formData.description}
          onChange={(e) => onChange(e, "description")}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Main Page Component
   ============================================================ */

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // ── Dashboard state ──
  const [stats, setStats] = useState<PackageStats>({
    totalPackages: 0,
    activePackages: 0,
    inactivePackages: 0,
    globalPackages: 0,
    companyPackages: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Management state ──
  const [packages, setPackages] = useState<Package[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("companyId") || "");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState("");

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  const [deletePackage, setDeletePackage] = useState<Package | null>(null);
  const [inactivePackageTarget, setInactivePackageTarget] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Toast Notification ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close status filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ============================================================
     API Calls
     ============================================================ */

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (json.companies && Array.isArray(json.companies)) {
        setCompanies(json.companies);
      }
    } catch (err) {
      console.error("Failed to load companies for filter:", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/packages");
      const json = await res.json();
      if (json.packages && Array.isArray(json.packages)) {
        const pkgList: Package[] = json.packages;
        const total = json.totalPackages || pkgList.length;
        const active = pkgList.filter((p) => p.status === "Active").length;
        const inactive = pkgList.filter((p) => p.status === "Inactive").length;
        const globalPkgs = pkgList.filter((p) => !p.companyId).length;
        const companyPkgs = pkgList.filter((p) => !!p.companyId).length;

        setStats({
          totalPackages: total,
          activePackages: active,
          inactivePackages: inactive,
          globalPackages: globalPkgs,
          companyPackages: companyPkgs,
        });
      }
    } catch (err) {
      console.error("Failed to load package statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async (p?: number, l?: number, s?: string, cId?: string, st?: string) => {
    const pg = p ?? pagination.page;
    const lm = l ?? pagination.limit;
    const sr = s ?? search;
    const cmpVal = cId ?? companyFilter;
    const stVal = st ?? statusFilter;

    setPackagesLoading(true);
    setPackagesError("");
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(lm),
      });
      if (sr.trim()) params.set("search", sr.trim());
      if (cmpVal.trim()) params.set("companyId", cmpVal.trim());
      if (stVal !== "All") params.set("status", stVal);

      const res = await fetch(`/api/packages?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch packages.");
      }

      const pkgArray: Package[] = json.packages || [];
      const totalRecs = json.totalPackages ?? pkgArray.length;
      const totalPgs = json.totalPages ?? Math.ceil(totalRecs / lm);

      if (pkgArray.length === 0 && pg > 1 && pg > totalPgs) {
        const validPage = Math.max(1, totalPgs);
        setPagination((prev) => ({ ...prev, page: validPage }));
        return;
      }

      setPackages(pkgArray);
      setPagination({
        page: json.currentPage || pg,
        limit: lm,
        totalRecords: totalRecs,
        totalPages: totalPgs,
      });
    } catch (err) {
      setPackagesError(err instanceof Error ? err.message : "Failed to load packages.");
    } finally {
      setPackagesLoading(false);
    }
  }, [pagination.page, pagination.limit, search, companyFilter, statusFilter]);

  const handleCreate = async () => {
    setFormErrors([]);
    if (!formData.packageName.trim()) {
      setFormErrors(["Package Name is required."]);
      return;
    }
    if (formData.scope === "COMPANY" && !formData.companyId) {
      setFormErrors(["Please select a Company for Company Package."]);
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        packageName: formData.packageName.trim().toUpperCase(),
        status: formData.status,
      };
      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.scope === "COMPANY" && formData.companyId) {
        body.companyId = formData.companyId;
      }

      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create package.");

      showToast("Package created successfully!");
      setCreateOpen(false);
      setFormData(emptyForm);
      fetchPackages();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create package.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPackage) return;
    setFormErrors([]);
    if (!formData.packageName.trim()) {
      setFormErrors(["Package Name is required."]);
      return;
    }
    if (formData.scope === "COMPANY" && !formData.companyId) {
      setFormErrors(["Please select a Company."]);
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        packageName: formData.packageName.trim().toUpperCase(),
        status: formData.status,
      };
      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.scope === "COMPANY" && formData.companyId) {
        body.companyId = formData.companyId;
      }

      const res = await fetch(`/api/packages/${editPackage.packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update package.");

      showToast("Package updated successfully!");
      setEditPackage(null);
      setFormData(emptyForm);
      fetchPackages();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update package.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePackage) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${deletePackage.packageId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete package.");

      showToast("Package deleted successfully!");
      setDeletePackage(null);
      fetchPackages();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete package.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmInactive = async () => {
    if (!inactivePackageTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${inactivePackageTarget.packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: inactivePackageTarget.packageName,
          description: inactivePackageTarget.description || "",
          status: "Inactive",
          ...(inactivePackageTarget.companyId ? { companyId: inactivePackageTarget.companyId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to inactivate package.");

      showToast("Package marked inactive.");
      setInactivePackageTarget(null);
      fetchPackages();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to inactivate package.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (pkg: Package) => {
    if (pkg.status === "Active") {
      setInactivePackageTarget(pkg);
    } else {
      setTogglingId(pkg.packageId);
      try {
        const res = await fetch(`/api/packages/${pkg.packageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageName: pkg.packageName,
            description: pkg.description || "",
            status: "Active",
            ...(pkg.companyId ? { companyId: pkg.companyId } : {}),
          }),
        });
        if (!res.ok) throw new Error("Failed to change status.");

        showToast("Package status set to Active.");
        fetchPackages();
        fetchStats();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to change status.", "error");
      } finally {
        setTogglingId(null);
      }
    }
  };

  /* ============================================================
     Effects & Event Handlers
     ============================================================ */

  useEffect(() => {
    fetchCompanies();
    fetchStats();
  }, [fetchCompanies, fetchStats]);

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
  }, [statusFilter, companyFilter]);

  const openEditModal = (pkg: Package) => {
    const isCompanyPkg = !!pkg.companyId;
    setFormData({
      packageName: pkg.packageName || "",
      scope: isCompanyPkg ? "COMPANY" : "GLOBAL",
      companyId: pkg.companyId || "",
      description: pkg.description || "",
      status: pkg.status,
    });
    setFormErrors([]);
    setEditPackage(pkg);
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setFormErrors([]);
    setCreateOpen(true);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof PackageFormData
  ) => {
    let val = e.target.value;
    if (field === "packageName") {
      val = val.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  /* ============================================================
     Render
     ============================================================ */

  return (
    <Layout>
      <div
        className="h-full flex-1 flex flex-col p-5 md:p-6 w-full mx-auto relative select-none overflow-hidden transition-colors duration-300"
        style={isDarkMode ? { background: "#18191A" } : { background: "#F0F7FF" }}
      >
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 transition-all animate-bounce ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/50 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Unified Header Bar: Tabs (Left) + Search / Filter / Actions (Right) */}
        <div className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          {/* Left: Segmented Tab Bar */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 self-start md:self-auto">
            {(
              [
                {
                  id: "dashboard" as TabId,
                  label: "Package Dashboard",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                },
                {
                  id: "management" as TabId,
                  label: "Package Management",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
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

          {/* Right: Search + Company Filter + Status Filter + Create (When in Management Tab) */}
          {activeTab === "management" ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
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

              {/* Searchable Company / Scope Filter */}
              <div className="w-48 sm:w-56">
                <SearchableCompanyDropdown
                  companies={companies}
                  selectedCompanyId={companyFilter}
                  onSelect={(cId) => setCompanyFilter(cId)}
                  allowAll
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative shrink-0" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border active:scale-98 ${
                    isDarkMode
                      ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#F0F6FC]"
                      : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      statusFilter === "Active"
                        ? "bg-emerald-500"
                        : statusFilter === "Inactive"
                        ? "bg-rose-500"
                        : "bg-sky-500"
                    }`}
                  />
                  <span>
                    {statusFilter === "All"
                      ? "All Status"
                      : statusFilter === "Active"
                      ? "Active Only"
                      : "Inactive Only"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      statusDropdownOpen
                        ? "rotate-180 text-sky-500"
                        : isDarkMode
                        ? "text-[#8B949E]"
                        : "text-slate-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown Popover */}
                {statusDropdownOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl p-1.5 z-50 animate-fade-in select-none border ${
                      isDarkMode
                        ? "bg-[#18191A] border-[#30363D] text-[#F0F6FC]"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div
                      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-b mb-1 ${
                        isDarkMode ? "text-[#8B949E] border-[#30363D]" : "text-slate-400 border-slate-100"
                      }`}
                    >
                      Filter By Status
                    </div>
                    {STATUS_FILTER_OPTIONS.map((opt) => {
                      const isSelected = statusFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(opt.value);
                            setStatusDropdownOpen(false);
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
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create Package Button */}
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Package</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Package</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            TAB 1 — PACKAGE DASHBOARD
            ============================================================ */}
        {activeTab === "dashboard" && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8 pr-1 pb-8">
            {statsLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                  Loading package analytics...
                </p>
              </div>
            )}

            {!statsLoading && (
              <>
                {/* ── Section 1: KPI Metrics ── */}
                <DashboardSection
                  title="Package Catalogue & Ecosystem Overview"
                  description="Live metrics of global cargo packaging definitions and dedicated corporate client rate types"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                      label="Total Packages"
                      value={stats.totalPackages}
                      breakdown={[
                        { label: "Active", value: stats.activePackages, color: "#23C55E" },
                        { label: "Inactive", value: stats.inactivePackages, color: "#EF4444" },
                      ]}
                      subtext={`${stats.activePackages} Active • ${stats.inactivePackages} Inactive`}
                      {...INFO}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Active Packages"
                      value={stats.activePackages}
                      percentage={stats.totalPackages > 0 ? Math.round((stats.activePackages / stats.totalPackages) * 100) : 0}
                      subtext={
                        stats.totalPackages > 0
                          ? `${Math.round((stats.activePackages / stats.totalPackages) * 100)}% active in billing`
                          : "Fully operational"
                      }
                      {...ACTIVE}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Inactive Packages"
                      value={stats.inactivePackages}
                      percentage={stats.totalPackages > 0 ? Math.round((stats.inactivePackages / stats.totalPackages) * 100) : 0}
                      subtext={
                        stats.inactivePackages > 0
                          ? `${stats.inactivePackages} packages disabled`
                          : "Zero disabled packages"
                      }
                      {...INACTIVE}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Global Packages"
                      value={stats.globalPackages}
                      percentage={stats.totalPackages > 0 ? Math.round((stats.globalPackages / stats.totalPackages) * 100) : 0}
                      subtext="Universal standard types"
                      {...VIOLET}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Company Packages"
                      value={stats.companyPackages}
                      percentage={stats.totalPackages > 0 ? Math.round((stats.companyPackages / stats.totalPackages) * 100) : 0}
                      subtext="Custom corporate rate types"
                      {...AMBER}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                        </svg>
                      }
                    />
                  </div>
                </DashboardSection>

                {/* ── Section 2: Visual Distribution & Operational Gauge ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Active vs Inactive Dual-Segment Donut Chart */}
                  <div
                    className="rounded-2xl p-5 border flex flex-col justify-between"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Package Status Distribution
                        </span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {stats.totalPackages} Total
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Operational ratio of active versus deactivated package models
                      </p>
                    </div>

                    <div className="flex items-center justify-center my-6 relative">
                      <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={isDarkMode ? "#30363D" : "#F1F5F9"}
                          strokeWidth="11"
                        />
                        {stats.totalPackages > 0 && stats.activePackages > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#23C55E"
                            strokeWidth="11"
                            strokeDasharray={`${(stats.activePackages / stats.totalPackages) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                        {stats.totalPackages > 0 && stats.inactivePackages > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="11"
                            strokeDashoffset={`-${(stats.activePackages / stats.totalPackages) * 238.76}`}
                            strokeDasharray={`${(stats.inactivePackages / stats.totalPackages) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                      </svg>

                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                          {stats.totalPackages > 0
                            ? Math.round((stats.activePackages / stats.totalPackages) * 100)
                            : 0}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-zinc-400">Active</span>
                        <span className="ml-auto font-black text-xs text-slate-900 dark:text-zinc-100">
                          {stats.activePackages}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-zinc-400">Inactive</span>
                        <span className="ml-auto font-black text-xs text-slate-900 dark:text-zinc-100">
                          {stats.inactivePackages}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Global vs Company Scope Ring Gauge */}
                  <div
                    className="rounded-2xl p-5 border flex flex-col justify-between"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Scope Composition
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                          Global vs Client
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Proportion of system-wide standard types vs customer custom rates
                      </p>
                    </div>

                    <div className="flex items-center justify-center my-6 relative">
                      <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={isDarkMode ? "#30363D" : "#F1F5F9"}
                          strokeWidth="11"
                        />
                        {stats.totalPackages > 0 && stats.globalPackages > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="11"
                            strokeDasharray={`${(stats.globalPackages / stats.totalPackages) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                        {stats.totalPackages > 0 && stats.companyPackages > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="11"
                            strokeDashoffset={`-${(stats.globalPackages / stats.totalPackages) * 238.76}`}
                            strokeDasharray={`${(stats.companyPackages / stats.totalPackages) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                      </svg>

                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                          {stats.totalPackages > 0
                            ? Math.round((stats.globalPackages / stats.totalPackages) * 100)
                            : 0}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Global
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-zinc-400">Global</span>
                        <span className="ml-auto font-black text-xs text-slate-900 dark:text-zinc-100">
                          {stats.globalPackages}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-zinc-400">Company</span>
                        <span className="ml-auto font-black text-xs text-slate-900 dark:text-zinc-100">
                          {stats.companyPackages}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rate Card & Network Benchmark */}
                  <div
                    className="rounded-2xl p-5 border flex flex-col justify-between"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Route Rate Coverage
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          Pricing Engine
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Active catalogue ready for direct booking and invoice tariff estimation
                      </p>
                    </div>

                    <div className="space-y-4 my-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600 dark:text-zinc-400">Global Standard Types</span>
                          <span className="text-slate-900 dark:text-zinc-100 font-mono">
                            {stats.globalPackages} Types
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (stats.globalPackages / Math.max(1, stats.totalPackages)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600 dark:text-zinc-400">Dedicated Company Types</span>
                          <span className="text-slate-900 dark:text-zinc-100 font-mono">
                            {stats.companyPackages} Custom
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (stats.companyPackages / Math.max(1, stats.totalPackages)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                        {companies.length} Connected Client Accounts
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Navigation Action Strip ── */}
                <div
                  className="rounded-2xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    background: isDarkMode ? "#242526" : "#FFFFFF",
                    borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        TMS Package Catalogue
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                        Configure universal standard packages or define custom client pricing packages.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("management")}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <span>View All Packages</span>
                    </button>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Create New Package</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2 — PACKAGE MANAGEMENT
            ============================================================ */}
        {activeTab === "management" && (
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            {/* Loading state */}
            {packagesLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                  Loading packages...
                </p>
              </div>
            )}

            {/* Error state */}
            {packagesError && !packagesLoading && (
              <div
                className="rounded-2xl p-8 text-center max-w-xl mx-auto my-4 w-full"
                style={
                  isDarkMode
                    ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
                    : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                <p className="text-sm font-semibold mb-4" style={{ color: "#EF4444" }}>
                  {packagesError}
                </p>
                <Button variant="secondary" size="sm" onClick={() => fetchPackages()}>
                  Retry Loading Packages
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!packagesLoading && !packagesError && packages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-sm font-semibold">
                  {search || companyFilter || statusFilter !== "All"
                    ? "No packages found matching your search or filter criteria."
                    : "No packages have been created yet."}
                </p>
                {!search && !companyFilter && statusFilter === "All" ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Create Your First Package
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setCompanyFilter("");
                      setStatusFilter("All");
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* Package Cards Grid Container (Scrollable) */}
            {!packagesLoading && !packagesError && packages.length > 0 && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.packageId}
                        onClick={() => {
                          if (pkg.companyId) {
                            router.push(`/global-route-rates?tab=company&packageId=${pkg.packageId}&companyId=${pkg.companyId}`);
                          } else {
                            router.push(`/global-route-rates?tab=global&packageId=${pkg.packageId}`);
                          }
                        }}
                        className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#242526] p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-md transition-all duration-200 group cursor-pointer select-none"
                      >
                        {/* Top Row: Icon + Name + Scope Badge + Status Badge */}
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
                                {!pkg.companyId ? (
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

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              pkg.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pkg.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {pkg.status}
                          </span>
                        </div>

                        {/* Card Body: Description & Configured Route Rates Bento */}
                        <div className="flex flex-col gap-2 pt-1">
                          <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {pkg.description || "No description provided."}
                          </p>

                          {/* Route Rates Counter */}
                          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                Configured Route Rates
                              </span>
                              <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                                {pkg.stats?.routeRates ?? 0} Rates
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Status Switch & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                          {/* Status toggle */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(pkg); }}
                            disabled={togglingId === pkg.packageId}
                            className="relative inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            title={`Switch to ${pkg.status === "Active" ? "Inactive" : "Active"}`}
                          >
                            <div className={`w-8 h-4.5 rounded-full transition-colors duration-200 ${pkg.status === "Active" ? "bg-emerald-600" : "bg-slate-300 dark:bg-zinc-700"}`}>
                              <div className={`w-3.5 h-3.5 mt-[2px] rounded-full bg-white shadow-xs transition-transform duration-200 ${pkg.status === "Active" ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                              {togglingId === pkg.packageId ? "..." : pkg.status === "Active" ? "ON" : "OFF"}
                            </span>
                          </button>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditModal(pkg); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-sky-50 dark:bg-zinc-900 dark:hover:bg-sky-950/40 text-slate-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Edit Package"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeletePackage(pkg); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Delete Package"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed Bottom Pagination Bar */}
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
        )}

        {/* ============================================================
            MODALS
            ============================================================ */}

        {/* Create Package Modal */}
        <Modal
          isOpen={createOpen}
          onClose={() => { setCreateOpen(false); setFormErrors([]); }}
          title="Create New Package"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => { setCreateOpen(false); setFormErrors([]); }}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-sky-600 hover:bg-sky-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Creating..." : "Create Package"}</span>
              </button>
            </div>
          }
        >
          <PackageForm
            isEdit={false}
            formData={formData}
            formErrors={formErrors}
            companies={companies}
            onChange={handleTextChange}
            onSelectCompany={(cId) => setFormData((prev) => ({ ...prev, companyId: cId }))}
            onScopeChange={(scope) =>
              setFormData((prev) => ({
                ...prev,
                scope,
                companyId: scope === "GLOBAL" ? "" : prev.companyId,
              }))
            }
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
            isDarkMode={isDarkMode}
          />
        </Modal>

        {/* Edit Package Modal */}
        <Modal
          isOpen={!!editPackage}
          onClose={() => { setEditPackage(null); setFormErrors([]); }}
          title={`Edit ${editPackage?.companyId ? "Company" : "Global"} Package`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => { setEditPackage(null); setFormErrors([]); }}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-sky-600 hover:bg-sky-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          }
        >
          <PackageForm
            isEdit={true}
            formData={formData}
            formErrors={formErrors}
            companies={companies}
            onChange={handleTextChange}
            onSelectCompany={(cId) => setFormData((prev) => ({ ...prev, companyId: cId }))}
            onScopeChange={() => {}}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
            isDarkMode={isDarkMode}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deletePackage}
          onClose={() => setDeletePackage(null)}
          title={`Delete ${deletePackage?.packageName || "Package"}?`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDeletePackage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Deleting..." : "Delete Permanently"}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-xs select-none">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
              <p className="font-bold mb-1">Warning: Irreversible Cascade Deletion</p>
              Deleting this {deletePackage?.companyId ? "company package" : "global package"} will also permanently remove:
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-rose-600 dark:text-rose-400">
                {deletePackage?.companyId ? (
                  <li>All company route rates configured for this package</li>
                ) : (
                  <li>All global route rates configured for this package</li>
                )}
              </ul>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
              Are you sure you want to proceed with deleting <strong className="text-slate-900 dark:text-zinc-100">{deletePackage?.packageName}</strong>?
            </p>
          </div>
        </Modal>

        {/* Inactive Confirmation Modal */}
        <Modal
          isOpen={!!inactivePackageTarget}
          onClose={() => setInactivePackageTarget(null)}
          title={`Mark ${inactivePackageTarget?.packageName || "Package"} Inactive?`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setInactivePackageTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmInactive}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-amber-600 hover:bg-amber-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Updating..." : "Mark Inactive"}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-xs select-none">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              <p className="font-bold mb-1">Cascade Inactivation Notice</p>
              Setting this {inactivePackageTarget?.companyId ? "company package" : "global package"} to <strong>Inactive</strong> will automatically disable:
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-amber-700 dark:text-amber-400">
                {inactivePackageTarget?.companyId ? (
                  <li>All company route rates configured for this package</li>
                ) : (
                  <li>All global route rates configured for this package</li>
                )}
              </ul>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
              No records will be deleted. You can re-enable this package at any time.
            </p>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
