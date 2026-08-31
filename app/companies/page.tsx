"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";
import { useAppSelector } from "@/store/hooks";
import StatCard from "@/app/dashboard/_components/StatCard";
import DashboardSection from "@/app/dashboard/_components/DashboardSection";

/* ─── Semantic Color Tokens ──────────────────────────────────── */
const INFO     = { iconColor: "#58A6FF", iconBg: "rgba(88,166,255,0.14)"  };
const ACTIVE   = { iconColor: "#23C55E", iconBg: "rgba(35,197,94,0.14)"   };
const INACTIVE = { iconColor: "#EF4444", iconBg: "rgba(239,68,68,0.14)"   };
const AMBER    = { iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.14)"  };
const VIOLET   = { iconColor: "#A78BFA", iconBg: "rgba(167,139,250,0.14)" };

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

interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalBranches: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

type TabId = "dashboard" | "management";

interface CompanyFormData {
  branchId: string;
  companyName: string;
  address: string;
  phoneNumber1: string;
  phoneNumber2: string;
  phoneNumber3: string;
  email: string;
  gstNumber: string;
  status: "Active" | "Inactive";
}

const emptyForm: CompanyFormData = {
  branchId: "",
  companyName: "",
  address: "",
  phoneNumber1: "",
  phoneNumber2: "",
  phoneNumber3: "",
  email: "",
  gstNumber: "",
  status: "Active",
};

interface CompanyFormProps {
  formData: CompanyFormData;
  formErrors: string[];
  branches: Branch[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof CompanyFormData) => void;
  onSelectBranch: (branchId: string) => void;
  onStatusChange: (status: "Active" | "Inactive") => void;
  isDarkMode: boolean;
}

/* ============================================================
   Modern ERP Company Form Component
   ============================================================ */

function CompanyForm({
  formData,
  formErrors,
  branches,
  onChange,
  onSelectBranch,
  onStatusChange,
  isDarkMode,
}: CompanyFormProps) {
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

      {/* Group 1: Company Identification & Branch */}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
            </svg>
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
            Company Identification & Branch Association
          </h4>
        </div>

        {/* Branch Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            Assigned Branch <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.branchId}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="w-full text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none transition-colors border cursor-pointer bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-100 border-slate-300 dark:border-zinc-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="">-- Select Assigned Branch --</option>
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.branchName} ({b.branchCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Company Name *"
            placeholder="e.g. ACME LOGISTICS"
            value={formData.companyName}
            onChange={(e) => onChange(e, "companyName")}
          />
          <Input
            label="GST Identification Number"
            placeholder="e.g. 33AAAAA0000A1Z5"
            value={formData.gstNumber}
            onChange={(e) => onChange(e, "gstNumber")}
          />
        </div>

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

      {/* Group 2: Physical Location & Contact Channels */}
      <div
        className="rounded-2xl p-4 border flex flex-col gap-4"
        style={
          isDarkMode
            ? { background: "#1C1D1E", borderColor: "#2D3139" }
            : { background: "#F8FAFC", borderColor: "#E2E8F0" }
        }
      >
        <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: isDarkMode ? "#2D3139" : "#E2E8F0" }}>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
            Physical Location & Contact Channels
          </h4>
        </div>

        <Input
          label="Registered Address"
          placeholder="e.g. Plot No. 42, SIDCO Industrial Estate, Ambattur"
          value={formData.address}
          onChange={(e) => onChange(e, "address")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Official Email"
            placeholder="billing@company.com"
            type="email"
            value={formData.email}
            onChange={(e) => onChange(e, "email")}
          />
          <Input
            label="Primary Phone Number *"
            placeholder="e.g. 9876543210"
            value={formData.phoneNumber1}
            onChange={(e) => onChange(e, "phoneNumber1")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Alternate Phone 2 (Optional)"
            placeholder="e.g. 044-24567890"
            value={formData.phoneNumber2}
            onChange={(e) => onChange(e, "phoneNumber2")}
          />
          <Input
            label="Alternate Phone 3 (Optional)"
            placeholder="e.g. 9123456789"
            value={formData.phoneNumber3}
            onChange={(e) => onChange(e, "phoneNumber3")}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Searchable Branch Filter Dropdown Component
   ============================================================ */

interface SearchableBranchDropdownProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  isDarkMode: boolean;
}

function SearchableBranchDropdown({
  branches,
  selectedBranchId,
  onSelect,
  isDarkMode,
}: SearchableBranchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedBranch = branches.find((b) => b.branchId === selectedBranchId);

  const filteredBranches = branches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      b.branchName.toLowerCase().includes(q) ||
      b.branchCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border active:scale-98 ${
          isDarkMode
            ? "bg-[#21262D] hover:bg-[#30363D] border-[#30363D] text-[#F0F6FC]"
            : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
        }`}
      >
        <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
        </svg>
        <span className="truncate max-w-[130px] sm:max-w-[160px]">
          {selectedBranch ? `${selectedBranch.branchName} (${selectedBranch.branchCode})` : "All Branches"}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
          className={`absolute left-0 mt-2 w-64 rounded-xl shadow-xl p-1.5 z-50 animate-fade-in select-none border max-h-72 flex flex-col ${
            isDarkMode
              ? "bg-[#18191A] border-[#30363D] text-[#F0F6FC]"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          <div className="p-1.5 border-b mb-1" style={{ borderColor: isDarkMode ? "#30363D" : "#F1F5F9" }}>
            <input
              type="text"
              placeholder="Search branch name or code..."
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
                selectedBranchId === ""
                  ? isDarkMode
                    ? "bg-sky-950/60 text-sky-300 font-extrabold"
                    : "bg-sky-50 text-sky-700 font-extrabold"
                  : isDarkMode
                  ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>All Branches</span>
              {selectedBranchId === "" && (
                <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {filteredBranches.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                No matching branch found
              </div>
            ) : (
              filteredBranches.map((b) => {
                const isSelected = selectedBranchId === b.branchId;
                return (
                  <button
                    key={b.branchId}
                    type="button"
                    onClick={() => {
                      onSelect(b.branchId);
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
                      <span className="truncate">{b.branchName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                        {b.branchCode}
                      </span>
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
   Main Page Component
   ============================================================ */

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // ── Dashboard state ──
  const [stats, setStats] = useState<CompanyStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalBranches: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Management state ──
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branchFilter, setBranchFilter] = useState(searchParams.get("branchId") || "");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [inactiveCompanyTarget, setInactiveCompanyTarget] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Toast/Feedback ──
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

  // Load branch list from GET /api/branches?limit=100
  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBranches(json.data);
      }
    } catch (err) {
      console.error("Failed to load branches for filter:", err);
    }
  }, []);

  // Fetch all companies to compute dashboard statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (json.companies && Array.isArray(json.companies)) {
        const compList: Company[] = json.companies;
        const total = json.totalCompanies || compList.length;
        const active = compList.filter((c) => c.status === "Active").length;
        const inactive = compList.filter((c) => c.status === "Inactive").length;
        const uniqueBranches = new Set(compList.map((c) => c.branchId)).size;

        setStats({
          totalCompanies: total,
          activeCompanies: active,
          inactiveCompanies: inactive,
          totalBranches: uniqueBranches,
        });
      }
    } catch (err) {
      console.error("Failed to load company statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch paginated companies: GET /api/companies?page=&limit=&search=&branchId=&status=
  const fetchCompanies = useCallback(async (p?: number, l?: number, s?: string, bId?: string, st?: string) => {
    const pg = p ?? pagination.page;
    const lm = l ?? pagination.limit;
    const sr = s ?? search;
    const brVal = bId ?? branchFilter;
    const stVal = st ?? statusFilter;

    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(lm),
      });
      if (sr.trim()) params.set("search", sr.trim());
      if (brVal.trim()) params.set("branchId", brVal.trim());
      if (stVal !== "All") params.set("status", stVal);

      const res = await fetch(`/api/companies?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch companies.");
      }

      const compArray: Company[] = json.companies || [];
      const totalRecs = json.totalCompanies ?? compArray.length;
      const totalPgs = json.totalPages ?? Math.ceil(totalRecs / lm);

      if (compArray.length === 0 && pg > 1 && pg > totalPgs) {
        const validPage = Math.max(1, totalPgs);
        setPagination((prev) => ({ ...prev, page: validPage }));
        return;
      }

      setCompanies(compArray);
      setPagination({
        page: json.currentPage || pg,
        limit: lm,
        totalRecords: totalRecs,
        totalPages: totalPgs,
      });
    } catch (err) {
      setCompaniesError(err instanceof Error ? err.message : "Failed to load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  }, [pagination.page, pagination.limit, search, branchFilter, statusFilter]);

  // Create company: POST /api/companies
  const handleCreate = async () => {
    setFormErrors([]);
    if (!formData.branchId) {
      setFormErrors(["Please select a Branch."]);
      return;
    }
    if (!formData.companyName.trim()) {
      setFormErrors(["Company Name is required."]);
      return;
    }

    setSubmitting(true);
    try {
      const selectedBranch = branches.find((b) => b.branchId === formData.branchId);

      const body: Record<string, string> = {
        branchId: formData.branchId,
        branchName: selectedBranch?.branchName || "",
        companyName: formData.companyName.trim().toUpperCase(),
        address: formData.address.trim(),
        phoneNumber1: formData.phoneNumber1.trim(),
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2.trim();
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3.trim();
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.gstNumber.trim()) body.gstNumber = formData.gstNumber.trim().toUpperCase();

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create company.");

      showToast("Company created successfully!");
      setCreateOpen(false);
      setFormData(emptyForm);
      fetchCompanies();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create company.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  // Update company: PUT /api/companies/[companyId]
  const handleUpdate = async () => {
    if (!editCompany) return;
    setFormErrors([]);
    if (!formData.branchId) {
      setFormErrors(["Please select a Branch."]);
      return;
    }
    if (!formData.companyName.trim()) {
      setFormErrors(["Company Name is required."]);
      return;
    }

    setSubmitting(true);
    try {
      const selectedBranch = branches.find((b) => b.branchId === formData.branchId);

      const body: Record<string, string> = {
        branchId: formData.branchId,
        branchName: selectedBranch?.branchName || editCompany.branchName,
        companyName: formData.companyName.trim().toUpperCase(),
        address: formData.address.trim(),
        phoneNumber1: formData.phoneNumber1.trim(),
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2.trim();
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3.trim();
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.gstNumber.trim()) body.gstNumber = formData.gstNumber.trim().toUpperCase();

      const res = await fetch(`/api/companies/${editCompany.companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update company.");

      showToast("Company updated successfully!");
      setEditCompany(null);
      setFormData(emptyForm);
      fetchCompanies();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update company.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete company: DELETE /api/companies/[companyId]
  const handleDelete = async () => {
    if (!deleteCompany) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${deleteCompany.companyId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete company.");

      const d = json.deleted;
      const msg = d
        ? `Company deleted! (Packages: ${d.packages}, Co. Rates: ${d.companyRouteRates})`
        : "Company deleted successfully!";

      showToast(msg);
      setDeleteCompany(null);
      fetchCompanies();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete company.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Cascade Inactive company: PUT /api/companies/[companyId] with status Inactive
  const handleConfirmInactive = async () => {
    if (!inactiveCompanyTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/companies/${inactiveCompanyTarget.companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: inactiveCompanyTarget.branchId,
          branchName: inactiveCompanyTarget.branchName,
          companyName: inactiveCompanyTarget.companyName,
          address: inactiveCompanyTarget.address,
          phoneNumber1: inactiveCompanyTarget.phoneNumber1,
          status: "Inactive",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to inactivate company.");

      const u = json.updated;
      const msg = u
        ? `Company & dependents marked inactive! (Packages: ${u.packages}, Co. Rates: ${u.companyRouteRates})`
        : "Company and related records marked inactive.";

      showToast(msg);
      setInactiveCompanyTarget(null);
      fetchCompanies();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to inactivate company.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status: show Inactive modal if active, else directly activate
  const handleToggleStatus = async (company: Company) => {
    if (company.status === "Active") {
      setInactiveCompanyTarget(company);
    } else {
      setTogglingId(company.companyId);
      try {
        const res = await fetch(`/api/companies/${company.companyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: company.branchId,
            branchName: company.branchName,
            companyName: company.companyName,
            address: company.address,
            phoneNumber1: company.phoneNumber1,
            status: "Active",
          }),
        });
        const json = await res.json();
        const u = json.updated;
        const msg = u
          ? `Company & dependents marked active! (Packages: ${u.packages}, Co. Rates: ${u.companyRouteRates})`
          : "Company status changed to Active.";

        showToast(msg);

        fetchCompanies();
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
    fetchBranches();
    fetchStats();
  }, [fetchBranches, fetchStats]);

  useEffect(() => {
    const bId = searchParams.get("branchId");
    if (bId) {
      setBranchFilter(bId);
      setActiveTab("management");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, branchFilter]);

  const openEditModal = (company: Company) => {
    setFormData({
      branchId: company.branchId,
      companyName: company.companyName || "",
      address: company.address || "",
      phoneNumber1: company.phoneNumber1 || "",
      phoneNumber2: company.phoneNumber2 || "",
      phoneNumber3: company.phoneNumber3 || "",
      email: company.email || "",
      gstNumber: company.gstNumber || "",
      status: company.status,
    });
    setFormErrors([]);
    setEditCompany(company);
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setFormErrors([]);
    setCreateOpen(true);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof CompanyFormData
  ) => {
    let val = e.target.value;
    if (field === "companyName" || field === "gstNumber") {
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
                  label: "Company Dashboard",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                },
                {
                  id: "management" as TabId,
                  label: "Company Management",
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

          {/* Right: Search + Branch Filter + Status Filter + Create (When in Management Tab) */}
          {activeTab === "management" ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="w-52 sm:w-64">
                <Input
                  placeholder="Search companies..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  icon={
                    <svg className="h-4 w-4 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  }
                />
              </div>

              {/* Searchable Branch Filter */}
              <SearchableBranchDropdown
                branches={branches}
                selectedBranchId={branchFilter}
                onSelect={(bId) => setBranchFilter(bId)}
                isDarkMode={isDarkMode}
              />

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

              {/* Create Company Button */}
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Company</span>
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
                <span>Create Company</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            TAB 1 — COMPANY DASHBOARD
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
                  Loading company analytics...
                </p>
              </div>
            )}

            {!statsLoading && (
              <>
                {/* ── Section 1: KPI Metrics ── */}
                <DashboardSection
                  title="Company Ecosystem Overview"
                  description="Live statistics of registered client companies, operational statuses, and branch linkages"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Companies"
                      value={stats.totalCompanies}
                      breakdown={[
                        { label: "Active", value: stats.activeCompanies, color: "#23C55E" },
                        { label: "Inactive", value: stats.inactiveCompanies, color: "#EF4444" },
                      ]}
                      subtext={`${stats.activeCompanies} Active • ${stats.inactiveCompanies} Inactive`}
                      {...INFO}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Active Companies"
                      value={stats.activeCompanies}
                      percentage={stats.totalCompanies > 0 ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100) : 0}
                      subtext={
                        stats.totalCompanies > 0
                          ? `${Math.round((stats.activeCompanies / stats.totalCompanies) * 100)}% of total companies operational`
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
                      label="Inactive Companies"
                      value={stats.inactiveCompanies}
                      percentage={stats.totalCompanies > 0 ? Math.round((stats.inactiveCompanies / stats.totalCompanies) * 100) : 0}
                      subtext={
                        stats.inactiveCompanies > 0
                          ? `${stats.inactiveCompanies} companies deactivated`
                          : "Zero deactivated companies"
                      }
                      {...INACTIVE}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      }
                    />

                    <StatCard
                      label="Associated Branches"
                      value={stats.totalBranches}
                      percentage={branches.length > 0 ? Math.min(100, Math.round((stats.totalBranches / branches.length) * 100)) : 0}
                      subtext="Branches serving active client accounts"
                      {...AMBER}
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
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
                          Company Status Mix
                        </span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {stats.totalCompanies} Total
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Operational ratio of active vs inactive client companies
                      </p>
                    </div>

                    <div className="flex items-center justify-center my-6 relative">
                      <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                        {/* Background Ring */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={isDarkMode ? "#30363D" : "#F1F5F9"}
                          strokeWidth="11"
                        />
                        {/* Active segment (Green) */}
                        {stats.totalCompanies > 0 && stats.activeCompanies > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#23C55E"
                            strokeWidth="11"
                            strokeDasharray={`${(stats.activeCompanies / stats.totalCompanies) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                        {/* Inactive segment (Rose) */}
                        {stats.totalCompanies > 0 && stats.inactiveCompanies > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="11"
                            strokeDashoffset={`-${(stats.activeCompanies / stats.totalCompanies) * 238.76}`}
                            strokeDasharray={`${(stats.inactiveCompanies / stats.totalCompanies) * 238.76} 238.76`}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        )}
                      </svg>

                      {/* Center Stat */}
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                          {stats.totalCompanies > 0
                            ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
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
                          {stats.activeCompanies}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-zinc-400">Inactive</span>
                        <span className="ml-auto font-black text-xs text-slate-900 dark:text-zinc-100">
                          {stats.inactiveCompanies}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Performance Ring Gauge */}
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
                          Account Activity Index
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                          Health Check
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Operational health index of companies currently configured in the ERP
                      </p>
                    </div>

                    <div className="my-6 flex flex-col items-center justify-center">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={isDarkMode ? "#30363D" : "#E2E8F0"}
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#0284C7"
                            strokeWidth="10"
                            strokeDasharray={251.2}
                            strokeDashoffset={
                              stats.totalCompanies > 0
                                ? 251.2 - (251.2 * (stats.activeCompanies / stats.totalCompanies))
                                : 251.2
                            }
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-900 dark:text-zinc-100">
                            {stats.totalCompanies > 0
                              ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
                              : 0}%
                          </span>
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                            Health Score
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-zinc-800">
                      <span className="text-xs text-slate-600 dark:text-zinc-400">Target Benchmark</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">95% Target</span>
                    </div>
                  </div>

                  {/* Network Rate & Coverage */}
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
                          Branch Multi-Tenancy
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          Coverage
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Spread of client organizations across connected branch nodes
                      </p>
                    </div>

                    <div className="space-y-4 my-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600 dark:text-zinc-400">Branch Linked Accounts</span>
                          <span className="text-slate-900 dark:text-zinc-100 font-mono">
                            {stats.totalBranches} Branches
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-sky-500 transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (stats.totalBranches / Math.max(1, branches.length)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600 dark:text-zinc-400">Operational Active Rate</span>
                          <span className="text-slate-900 dark:text-zinc-100 font-mono">
                            {stats.totalCompanies > 0
                              ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700"
                            style={{
                              width: `${
                                stats.totalCompanies > 0
                                  ? (stats.activeCompanies / stats.totalCompanies) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                        {branches.length} Total Registered Branches
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                        Company Records & Directory
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                        Manage corporate client accounts, package definitions, and company route rate cards.
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                      </svg>
                      <span>View All Companies</span>
                    </button>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Create New Company</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2 — COMPANY MANAGEMENT
            ============================================================ */}
        {activeTab === "management" && (
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            {/* Loading state */}
            {companiesLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                  Loading companies...
                </p>
              </div>
            )}

            {/* Error state */}
            {companiesError && !companiesLoading && (
              <div
                className="rounded-2xl p-8 text-center max-w-xl mx-auto my-4 w-full"
                style={
                  isDarkMode
                    ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
                    : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                <p className="text-sm font-semibold mb-4" style={{ color: "#EF4444" }}>
                  {companiesError}
                </p>
                <Button variant="secondary" size="sm" onClick={() => fetchCompanies()}>
                  Retry Loading Companies
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!companiesLoading && !companiesError && companies.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-sm font-semibold">
                  {search || branchFilter || statusFilter !== "All"
                    ? "No companies found matching your search or filter criteria."
                    : "No companies have been created yet."}
                </p>
                {!search && !branchFilter && statusFilter === "All" ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Create Your First Company
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setBranchFilter("");
                      setStatusFilter("All");
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* Company Cards Grid Container (Scrollable) */}
            {!companiesLoading && !companiesError && companies.length > 0 && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {companies.map((company) => (
                      <div
                        key={company.companyId}
                        onClick={() => router.push(`/packages?companyId=${company.companyId}`)}
                        className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#242526] p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-md transition-all duration-200 group cursor-pointer select-none"
                      >
                        {/* Top Row: Icon + Name + Branch Tag + Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {company.companyName}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40">
                                  <svg className="w-2.5 h-2.5 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                                  </svg>
                                  <span>{company.branchName || "Branch"} {company.branchCode ? `(${company.branchCode})` : ""}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              company.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${company.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {company.status}
                          </span>
                        </div>

                        {/* Card Body: Address, Phone, Email & GST */}
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-400">
                            <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                            </svg>
                            <span className="line-clamp-2 leading-relaxed">{company.address || "No address specified"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                            <svg className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{company.phoneNumber1 || "N/A"}</span>
                            {company.phoneNumber2 && (
                              <span className="text-slate-400 dark:text-zinc-500">/ {company.phoneNumber2}</span>
                            )}
                          </div>

                          {company.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                              <span className="truncate">{company.email}</span>
                            </div>
                          )}

                          {company.gstNumber && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-zinc-400">
                              <span className="font-bold text-slate-400 dark:text-zinc-500">GST:</span>
                              <span className="font-bold text-slate-700 dark:text-zinc-300">{company.gstNumber}</span>
                            </div>
                          )}

                          {/* ERP Micro-Stats Grid */}
                          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 select-none">
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Co. Packages</span>
                              <span className="text-xs font-black text-violet-600 dark:text-violet-400">{company.stats?.companyPackages ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Co. Rates</span>
                              <span className="text-xs font-black text-sky-600 dark:text-sky-400">{company.stats?.companyRouteRates ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Status Switch & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                          {/* Status toggle */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(company); }}
                            disabled={togglingId === company.companyId}
                            className="relative inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            title={`Switch to ${company.status === "Active" ? "Inactive" : "Active"}`}
                          >
                            <div className={`w-8 h-4.5 rounded-full transition-colors duration-200 ${company.status === "Active" ? "bg-emerald-600" : "bg-slate-300 dark:bg-zinc-700"}`}>
                              <div className={`w-3.5 h-3.5 mt-[2px] rounded-full bg-white shadow-xs transition-transform duration-200 ${company.status === "Active" ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                              {togglingId === company.companyId ? "..." : company.status === "Active" ? "ON" : "OFF"}
                            </span>
                          </button>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditModal(company); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-sky-50 dark:bg-zinc-900 dark:hover:bg-sky-950/40 text-slate-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Edit Company"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteCompany(company); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Delete Company"
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
                    entityName="companies"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            MODALS
            ============================================================ */}

        {/* Create Company Modal */}
        <Modal
          isOpen={createOpen}
          onClose={() => { setCreateOpen(false); setFormErrors([]); }}
          title="Create New Company"
          size="lg"
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
                <span>{submitting ? "Creating..." : "Create Company"}</span>
              </button>
            </div>
          }
        >
          <CompanyForm
            formData={formData}
            formErrors={formErrors}
            branches={branches}
            onChange={handleTextChange}
            onSelectBranch={(bId) => setFormData((prev) => ({ ...prev, branchId: bId }))}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
            isDarkMode={isDarkMode}
          />
        </Modal>

        {/* Edit Company Modal */}
        <Modal
          isOpen={!!editCompany}
          onClose={() => { setEditCompany(null); setFormErrors([]); }}
          title="Edit Company"
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => { setEditCompany(null); setFormErrors([]); }}
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
          <CompanyForm
            formData={formData}
            formErrors={formErrors}
            branches={branches}
            onChange={handleTextChange}
            onSelectBranch={(bId) => setFormData((prev) => ({ ...prev, branchId: bId }))}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
            isDarkMode={isDarkMode}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteCompany}
          onClose={() => setDeleteCompany(null)}
          title={`Delete ${deleteCompany?.companyName || "Company"}?`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDeleteCompany(null)}
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
              Deleting this company will also permanently remove:
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-rose-600 dark:text-rose-400">
                <li>All packages and special package types linked to this company</li>
                <li>All company route rates configured for this company</li>
              </ul>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
              Are you sure you want to proceed with deleting <strong className="text-slate-900 dark:text-zinc-100">{deleteCompany?.companyName}</strong>?
            </p>
          </div>
        </Modal>

        {/* Inactive Confirmation Modal */}
        <Modal
          isOpen={!!inactiveCompanyTarget}
          onClose={() => setInactiveCompanyTarget(null)}
          title={`Mark ${inactiveCompanyTarget?.companyName || "Company"} Inactive?`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setInactiveCompanyTarget(null)}
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
              Setting this company status to <strong>Inactive</strong> will automatically disable:
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-amber-700 dark:text-amber-400">
                <li>All packages belonging to this company</li>
                <li>All company route rates configured for this company</li>
              </ul>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
              No records will be deleted. You can re-enable this company at any time.
            </p>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}


