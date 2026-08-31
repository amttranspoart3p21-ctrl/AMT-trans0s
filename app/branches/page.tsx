"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
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
  badgeBg: string;
  badgeBorder: string;
}> = [
  {
    value: "All",
    label: "All Status",
    dotColor: "bg-sky-500",
    badgeBg: "bg-sky-50 dark:bg-sky-950/40",
    badgeBorder: "border-sky-200 dark:border-sky-800/40",
  },
  {
    value: "Active",
    label: "Active Only",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    value: "Inactive",
    label: "Inactive Only",
    dotColor: "bg-rose-500",
    badgeBg: "bg-rose-50 dark:bg-rose-950/40",
    badgeBorder: "border-rose-200 dark:border-rose-800/40",
  },
];

/** Safe percentage calculation */
const pct = (n: number, total: number) =>
  total > 0 ? Math.round((n / total) * 100) : 0;

/* ============================================================
   Types
   ============================================================ */

interface BranchStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

type TabId = "dashboard" | "management";

/* ============================================================
   Branch Form – shared for Create & Edit
   ============================================================ */

interface BranchFormData {
  branchName: string;
  branchCode: string;
  address: string;
  phoneNumber1: string;
  phoneNumber2: string;
  phoneNumber3: string;
  phoneNumber4: string;
  phoneNumber5: string;
  status: "Active" | "Inactive";
}

const emptyForm: BranchFormData = {
  branchName: "",
  branchCode: "",
  address: "",
  phoneNumber1: "",
  phoneNumber2: "",
  phoneNumber3: "",
  phoneNumber4: "",
  phoneNumber5: "",
  status: "Active",
};

interface BranchFormProps {
  formData: BranchFormData;
  formErrors: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof BranchFormData) => void;
  onStatusChange: (status: "Active" | "Inactive") => void;
}


function BranchForm({
  formData,
  formErrors,
  onChange,
  onStatusChange,
}: BranchFormProps) {
  return (
    <div className="flex flex-col gap-4 select-none">
      {formErrors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3.5 text-rose-700 dark:text-rose-300 text-xs font-medium flex flex-col gap-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-200">
            <svg className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>Please correct the following:</span>
          </div>
          {formErrors.map((e, i) => (
            <span key={i} className="pl-5">• {e}</span>
          ))}
        </div>
      )}

      {/* ── Section 1: Branch Identification & Status ── */}
      <div className="bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
          <div className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Branch Identification & Status
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
          <div className="sm:col-span-2">
            <Input
              label="Branch Name *"
              placeholder="e.g. MUMBAI CENTRAL"
              value={formData.branchName}
              onChange={(e) => onChange(e, "branchName")}
              icon={
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                </svg>
              }
            />
          </div>
          <div>
            <Input
              label="Branch Code *"
              placeholder="e.g. MUM"
              value={formData.branchCode}
              onChange={(e) => onChange(e, "branchCode")}
              icon={
                <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Operational Status Selector */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            Operational Status
          </label>
          <div className="inline-flex p-1 bg-slate-200/70 dark:bg-zinc-950 rounded-xl border border-slate-300/70 dark:border-zinc-800 w-fit">
            {(["Active", "Inactive"] as const).map((s) => {
              const isSelected = formData.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? s === "Active"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-300/50 dark:hover:bg-zinc-850"
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

      {/* ── Section 2: Physical Address ── */}
      <div className="bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
          <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Physical Location & Address
          </span>
        </div>

        <Input
          label="Full Branch Address *"
          placeholder="e.g. Unit 4, Logistics Park, Western Express Highway, Mumbai - 400001"
          value={formData.address}
          onChange={(e) => onChange(e, "address")}
          icon={
            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Section 3: Contact Phone Numbers ── */}
      <div className="bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3.5 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
            Contact Channels & Phone Directory
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Primary Phone 1 (Required) *"
            placeholder="+91 99XXX XXXXX"
            value={formData.phoneNumber1}
            onChange={(e) => onChange(e, "phoneNumber1")}
            icon={
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            }
          />
          <Input
            label="Secondary Phone 2"
            placeholder="Optional secondary contact"
            value={formData.phoneNumber2}
            onChange={(e) => onChange(e, "phoneNumber2")}
            icon={
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="Phone 3 (Optional)"
            placeholder="Optional"
            value={formData.phoneNumber3}
            onChange={(e) => onChange(e, "phoneNumber3")}
          />
          <Input
            label="Phone 4 (Optional)"
            placeholder="Optional"
            value={formData.phoneNumber4}
            onChange={(e) => onChange(e, "phoneNumber4")}
          />
          <Input
            label="Phone 5 (Optional)"
            placeholder="Optional"
            value={formData.phoneNumber5}
            onChange={(e) => onChange(e, "phoneNumber5")}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Page Component
   ============================================================ */

export default function BranchesPage() {
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // ── Dashboard state ──
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // ── Management state ──
  const [branches, setBranches] = useState<Branch[]>([]);

  // Aggregated branch network totals
  const totalConnectedCompanies = branches.reduce((acc, b) => acc + (b.stats?.companies ?? 0), 0);
  const totalCompanyPackages = branches.reduce((acc, b) => acc + (b.stats?.companyPackages ?? 0), 0);
  const totalCompanyRouteRates = branches.reduce((acc, b) => acc + (b.stats?.companyRouteRates ?? 0), 0);
  const totalGlobalRouteRates = branches.reduce((acc, b) => acc + (b.stats?.globalRouteRates ?? 0), 0);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");

  // Close status filter dropdown when clicking outside
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

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);
  const [inactiveBranchTarget, setInactiveBranchTarget] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);


  // ── Toast/Feedback ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ============================================================
     API Calls
     ============================================================ */

  // Fetch dashboard statistics: GET /api/branches/statistics
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetch("/api/branches/statistics");
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Server returned HTML error page (${res.status} ${res.statusText || ""})`);
      }
      if (!res.ok || !json.success) throw new Error(json.message || `Failed to load statistics (${res.status})`);
      setStats(json.data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Failed to load statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch branches with pagination + search: GET /api/branches?page=&limit=&search=&status=
  const fetchBranches = useCallback(async (p?: number, l?: number, s?: string, st?: string) => {
    const pg = p ?? pagination.page;
    const lm = l ?? pagination.limit;
    const sr = s ?? search;
    const statusVal = st ?? statusFilter;

    setBranchesLoading(true);
    setBranchesError("");
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(lm),
      });
      if (sr.trim()) params.set("search", sr.trim());
      if (statusVal !== "All") params.set("status", statusVal);

      const res = await fetch(`/api/branches?${params.toString()}`);
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Server returned HTML error page (${res.status} ${res.statusText || ""})`);
      }
      if (!res.ok || !json.success) throw new Error(json.message || `Failed to load branches (${res.status})`);

      // Check if current page is empty/invalid due to deletion, adjust page if so
      if (json.data.length === 0 && json.pagination.page > 1 && json.pagination.page > json.pagination.totalPages) {
        const validPage = Math.max(1, json.pagination.totalPages);
        setPagination((prev) => ({ ...prev, page: validPage }));
        return;
      }

      setBranches(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : "Failed to load branches.");
    } finally {
      setBranchesLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  // Create branch: POST /api/branches
  const handleCreate = async () => {
    setFormErrors([]);
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        branchName: formData.branchName.trim().toUpperCase(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        address: formData.address,
        phoneNumber1: formData.phoneNumber1,
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2;
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3;
      if (formData.phoneNumber4.trim()) body.phoneNumber4 = formData.phoneNumber4;
      if (formData.phoneNumber5.trim()) body.phoneNumber5 = formData.phoneNumber5;

      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      showToast("Branch created successfully!");
      setCreateOpen(false);
      setFormData(emptyForm);
      fetchBranches();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create branch.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  // Update branch: PUT /api/branches/[branchId]
  const handleUpdate = async () => {
    if (!editBranch) return;
    setFormErrors([]);
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        branchName: formData.branchName.trim().toUpperCase(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        address: formData.address,
        phoneNumber1: formData.phoneNumber1,
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2;
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3;
      if (formData.phoneNumber4.trim()) body.phoneNumber4 = formData.phoneNumber4;
      if (formData.phoneNumber5.trim()) body.phoneNumber5 = formData.phoneNumber5;

      const res = await fetch(`/api/branches/${editBranch.branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      showToast("Branch updated successfully!");
      setEditBranch(null);
      setFormData(emptyForm);
      fetchBranches();
      fetchStats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update branch.";
      setFormErrors(msg.split("\n"));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete branch: DELETE /api/branches/[branchId]
  const handleDelete = async () => {
    if (!deleteBranch) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/branches/${deleteBranch.branchId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const d = json.deleted;
      const msg = d
        ? `Branch deleted! (Companies: ${d.companies}, Packages: ${d.companyPackages}, Co. Rates: ${d.companyRouteRates}, Global Rates: ${d.globalRouteRates})`
        : "Branch deleted successfully!";

      showToast(msg);
      setDeleteBranch(null);
      fetchBranches();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete branch.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Cascade Inactive branch: PUT /api/branches/[branchId] with status Inactive
  const handleConfirmInactive = async () => {
    if (!inactiveBranchTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/branches/${inactiveBranchTarget.branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchName: inactiveBranchTarget.branchName.toUpperCase(),
          branchCode: inactiveBranchTarget.branchCode.toUpperCase(),
          address: inactiveBranchTarget.address,
          phoneNumber1: inactiveBranchTarget.phoneNumber1,
          status: "Inactive",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const u = json.updated;
      const msg = u
        ? `Branch & dependents marked inactive! (Companies: ${u.companies}, Packages: ${u.companyPackages}, Co. Rates: ${u.companyRouteRates}, Global Rates: ${u.globalRouteRates})`
        : "Branch and related records marked inactive.";

      showToast(msg);
      setInactiveBranchTarget(null);
      fetchBranches();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to inactivate branch.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status trigger: show Inactive confirmation modal if active, else directly activate
  const handleToggleStatus = async (branch: Branch) => {
    if (branch.status === "Active") {
      setInactiveBranchTarget(branch);
    } else {
      setTogglingId(branch.branchId);
      try {
        const res = await fetch(`/api/branches/${branch.branchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchName: branch.branchName.toUpperCase(),
            branchCode: branch.branchCode.toUpperCase(),
            address: branch.address,
            phoneNumber1: branch.phoneNumber1,
            status: "Active",
          }),
        });
        const json = await res.json();
        const u = json.updated;
        const msg = u
          ? `Branch & dependents marked active! (Companies: ${u.companies}, Packages: ${u.companyPackages}, Co. Rates: ${u.companyRouteRates}, Global Rates: ${u.globalRouteRates})`
          : "Branch status changed to Active.";

        showToast(msg);

        fetchBranches();
        fetchStats();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to change status.", "error");
      } finally {
        setTogglingId(null);
      }
    }
  };


  /* ============================================================
     Effects
     ============================================================ */

  // Load stats on mount and when tab changes to dashboard
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Load branches on mount and when pagination/search changes
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset page to 1 when statusFilter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter]);

  // Open edit modal with pre-filled data
  const openEditModal = (branch: Branch) => {
    setFormData({
      branchName: (branch.branchName || "").toUpperCase(),
      branchCode: (branch.branchCode || "").toUpperCase(),
      address: branch.address,
      phoneNumber1: branch.phoneNumber1,
      phoneNumber2: branch.phoneNumber2 ?? "",
      phoneNumber3: branch.phoneNumber3 ?? "",
      phoneNumber4: branch.phoneNumber4 ?? "",
      phoneNumber5: branch.phoneNumber5 ?? "",
      status: branch.status,
    });
    setFormErrors([]);
    setEditBranch(branch);
  };

  const openCreateModal = () => {
    setFormData(emptyForm);
    setFormErrors([]);
    setCreateOpen(true);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof BranchFormData
  ) => {
    let val = e.target.value;
    if (field === "branchName" || field === "branchCode") {
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
        {/* Top Unified Header Bar: Tabs (Left) + Search / Filter / Actions (Right) */}
        <div className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          {/* Left: Segmented Tab Bar */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 self-start md:self-auto">
            {(
              [
                {
                  id: "dashboard" as TabId,
                  label: "Branch Dashboard",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                },
                {
                  id: "management" as TabId,
                  label: "Branch Management",
                  icon: (
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
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

          {/* Right: Search + Status Filter + Create (When in Management Tab) */}
          {activeTab === "management" ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="w-56 sm:w-72">
                <Input
                  placeholder="Search branches..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  icon={
                    <svg className="h-4 w-4 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  }
                />
              </div>

              {/* Custom Status Filter Dropdown */}
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

              {/* Create Branch Button */}
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Branch</span>
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
                <span>Create Branch</span>
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            TAB 1 — BRANCH DASHBOARD
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
                  Loading branch statistics...
                </p>
              </div>
            )}

            {statsError && (
              <div
                className="rounded-2xl p-8 text-center max-w-xl mx-auto my-4 w-full"
                style={
                  isDarkMode
                    ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
                    : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                <svg
                  className="h-10 w-10 mx-auto mb-3"
                  style={{ color: "#EF4444" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm font-semibold mb-4" style={{ color: "#EF4444" }}>
                  {statsError}
                </p>
                <Button variant="secondary" size="sm" onClick={fetchStats}>
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Retry Loading Statistics
                </Button>
              </div>
            )}

            {stats && !statsLoading && (
              <>
                {/* ══════════════════════════════════════
                    1. BRANCHES — 3-col uniform grid
                    ══════════════════════════════════════ */}
                <DashboardSection title="Branches" description="Network branch statistics & operational status">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Branches — Real breakdown donut & split bar */}
                    <StatCard
                      label="Total Branches"
                      value={stats.totalBranches}
                      breakdown={[
                        { label: "Active", value: stats.activeBranches, color: "#23C55E" },
                        { label: "Inactive", value: stats.inactiveBranches, color: "#EF4444" },
                      ]}
                      subtext={`${stats.activeBranches} Active • ${stats.inactiveBranches} Inactive`}
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
                      value={stats.activeBranches}
                      percentage={pct(stats.activeBranches, stats.totalBranches)}
                      subtext={`${stats.activeBranches} of ${stats.totalBranches} operational`}
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
                      value={stats.inactiveBranches}
                      percentage={pct(stats.inactiveBranches, stats.totalBranches)}
                      subtext={stats.inactiveBranches === 0 ? "Zero inactive branches" : `${stats.inactiveBranches} need attention`}
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
                    2. NETWORK CONNECTIVITY & COVERAGE — 4-col responsive grid
                    ══════════════════════════════════════ */}
                <DashboardSection title="Network Entities" description="Aggregated company accounts, packages & route rates">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Connected Companies */}
                    <StatCard
                      label="Connected Companies"
                      value={totalConnectedCompanies}
                      percentage={pct(totalConnectedCompanies, totalConnectedCompanies || 1)}
                      subtext={`Across ${stats.totalBranches} branches`}
                      {...AMBER}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                      }
                    />
                    {/* Company Packages */}
                    <StatCard
                      label="Company Packages"
                      value={totalCompanyPackages}
                      percentage={pct(totalCompanyPackages, (totalCompanyPackages + totalCompanyRouteRates) || 1)}
                      subtext="Account-specific packages"
                      {...VIOLET}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      }
                    />
                    {/* Company Route Rates */}
                    <StatCard
                      label="Company Route Rates"
                      value={totalCompanyRouteRates}
                      percentage={pct(totalCompanyRouteRates, (totalCompanyRouteRates + totalGlobalRouteRates) || 1)}
                      subtext="Custom negotiated rates"
                      {...INFO}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.75l-4.5 4.5m-6 6l-4.5 4.5M3 13.5h3.75m10.5 0H21m-6-6h3.75m-15 0H7.5" />
                        </svg>
                      }
                    />
                    {/* Global Route Rates */}
                    <StatCard
                      label="Global Route Rates"
                      value={totalGlobalRouteRates}
                      percentage={pct(totalGlobalRouteRates, (totalCompanyRouteRates + totalGlobalRouteRates) || 1)}
                      subtext="Standard network rates"
                      {...ACTIVE}
                      icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-15.432-4.471A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253" />
                        </svg>
                      }
                    />
                  </div>
                </DashboardSection>

                {/* ══════════════════════════════════════
                    3. OPERATIONAL HEALTH / QUICK ACTIONS BANNER
                    ══════════════════════════════════════ */}
                <div
                  className="rounded-xl p-6 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  style={
                    isDarkMode
                      ? {
                          background: "#242526",
                          border: "1px solid #21262D",
                          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.35)",
                        }
                      : {
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05)",
                        }
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3
                        className="text-xs font-bold uppercase tracking-[0.12em]"
                        style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
                      >
                        Branch Network Health & Operational Rate
                      </h3>
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}
                    >
                      {stats.totalBranches > 0
                        ? `${Math.round((stats.activeBranches / stats.totalBranches) * 100)}% of your transport branch network is actively operational.`
                        : "No branch network records found."}
                    </p>
                    
                    {/* Activity Rate Bar */}
                    <div className="flex items-center gap-3 mt-4 max-w-md">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0" }}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                          style={{
                            width: stats.totalBranches > 0
                              ? `${(stats.activeBranches / stats.totalBranches) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-black tabular-nums"
                        style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
                      >
                        {stats.totalBranches > 0
                          ? Math.round((stats.activeBranches / stats.totalBranches) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("management")}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                      <span>View All Branches</span>
                    </button>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Create New Branch</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 2 — BRANCH MANAGEMENT
            ============================================================ */}
        {activeTab === "management" && (
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
            {/* Loading state */}
            {branchesLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                  Loading branches...
                </p>
              </div>
            )}

            {/* Error state */}
            {branchesError && !branchesLoading && (
              <div
                className="rounded-2xl p-8 text-center max-w-xl mx-auto my-4 w-full"
                style={
                  isDarkMode
                    ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
                    : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                <p className="text-sm font-semibold mb-4" style={{ color: "#EF4444" }}>
                  {branchesError}
                </p>
                <Button variant="secondary" size="sm" onClick={() => fetchBranches()}>
                  Retry Loading Branches
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!branchesLoading && !branchesError && branches.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-sm font-semibold">
                  {search ? "No branches found matching your search." : "No branches have been created yet."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Create Your First Branch
                  </button>
                )}
              </div>
            )}

            {/* Branch Cards Grid Container (Only this scrolls) */}
            {!branchesLoading && !branchesError && branches.length > 0 && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {branches.map((branch) => (
                      <div
                        key={branch.branchId}
                        onClick={() => router.push(`/companies?branchId=${branch.branchId}`)}
                        className="relative rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#242526] p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-md transition-all duration-200 group cursor-pointer select-none"
                      >
                        {/* Top Row: Icon + Name/Code + Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shrink-0 transition-transform group-hover:scale-105">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {branch.branchName}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40">
                                  {branch.branchCode}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              branch.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${branch.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {branch.status}
                          </span>
                        </div>

                        {/* Card Body: Address & Phone */}
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-400">
                            <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                            </svg>
                            <span className="line-clamp-2 leading-relaxed">{branch.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                            <svg className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{branch.phoneNumber1}</span>
                          </div>

                          {/* ERP Micro-Stats Grid */}
                          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 select-none">
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Companies</span>
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{branch.stats?.companies ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Co. Packages</span>
                              <span className="text-xs font-black text-violet-600 dark:text-violet-400">{branch.stats?.companyPackages ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Co. Rates</span>
                              <span className="text-xs font-black text-sky-600 dark:text-sky-400">{branch.stats?.companyRouteRates ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800/70 rounded-xl p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Global Rates</span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{branch.stats?.globalRouteRates ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Status Switch & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                          {/* Status toggle */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(branch); }}
                            disabled={togglingId === branch.branchId}
                            className="relative inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            title={`Switch to ${branch.status === "Active" ? "Inactive" : "Active"}`}
                          >
                            <div className={`w-8 h-4.5 rounded-full transition-colors duration-200 ${branch.status === "Active" ? "bg-emerald-600" : "bg-slate-300 dark:bg-zinc-700"}`}>
                              <div className={`w-3.5 h-3.5 mt-[2px] rounded-full bg-white shadow-xs transition-transform duration-200 ${branch.status === "Active" ? "translate-x-[15px]" : "translate-x-[2px]"}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                              {togglingId === branch.branchId ? "..." : branch.status === "Active" ? "ON" : "OFF"}
                            </span>
                          </button>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditModal(branch); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-sky-50 dark:bg-zinc-900 dark:hover:bg-sky-950/40 text-slate-600 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Edit Branch"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteBranch(branch); }}
                              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                              title="Delete Branch"
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
                    entityName="branches"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================
            MODALS
            ============================================================ */}

        {/* Create Branch Modal */}
        <Modal
          isOpen={createOpen}
          onClose={() => { setCreateOpen(false); setFormErrors([]); }}
          title="Create New Branch"
          size="lg"
          footer={
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { setCreateOpen(false); setFormErrors([]); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300/70 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Branch...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Create Branch</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <BranchForm
            formData={formData}
            formErrors={formErrors}
            onChange={handleTextChange}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Edit Branch Modal */}
        <Modal
          isOpen={!!editBranch}
          onClose={() => { setEditBranch(null); setFormErrors([]); }}
          title={`Edit Branch: ${editBranch?.branchName || ""}`}
          size="lg"
          footer={
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { setEditBranch(null); setFormErrors([]); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300/70 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <BranchForm
            formData={formData}
            formErrors={formErrors}
            onChange={handleTextChange}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteBranch}
          onClose={() => setDeleteBranch(null)}
          title={`Delete Branch: ${deleteBranch?.branchName || ""}?`}
          size="md"
          footer={
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteBranch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300/70 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submitting ? "Deleting..." : "Delete Branch"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1 text-xs text-slate-700 dark:text-zinc-300 select-none">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
              <svg className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-bold">This action cannot be undone.</p>
                <p className="text-[11px] mt-0.5 opacity-90">Deleting this branch will permanently cascade-delete associated records.</p>
              </div>
            </div>

            <p className="font-bold text-slate-800 dark:text-zinc-200 pt-1">
              The following linked data will be deleted:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-1 text-[11px]">
              <li>All companies registered under this branch</li>
              <li>All company/special packages belonging to those companies</li>
              <li>All company route rates belonging to those companies/packages</li>
              <li>All global route rates where this branch is used as From or To branch</li>
            </ul>
          </div>
        </Modal>

        {/* Inactive Confirmation Modal */}
        <Modal
          isOpen={!!inactiveBranchTarget}
          onClose={() => setInactiveBranchTarget(null)}
          title={`Make ${inactiveBranchTarget?.branchName || "Branch"} Inactive?`}
          size="md"
          footer={
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setInactiveBranchTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300/70 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInactive}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submitting ? "Updating..." : "Make Inactive"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1 text-xs text-slate-700 dark:text-zinc-300 select-none">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <svg className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-bold">No data will be deleted.</p>
                <p className="text-[11px] mt-0.5 opacity-90">Associated company records and route rates will also be marked inactive.</p>
              </div>
            </div>

            <p className="font-bold text-slate-800 dark:text-zinc-200 pt-1">
              The following will be marked inactive:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-1 text-[11px]">
              <li>All companies registered under this branch</li>
              <li>All company/special packages belonging to those companies</li>
              <li>All company route rates belonging to those companies/packages</li>
              <li>All global route rates where this branch is used as From or To branch</li>
            </ul>
          </div>
        </Modal>


        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl border shadow-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/90 border-rose-500/30 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            {toast.message}
          </div>
        )}
      </div>
    </Layout>
  );
}
