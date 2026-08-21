"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Branch } from "@/types/branch";

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
    <div className="flex flex-col gap-4">
      {formErrors.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium flex flex-col gap-1">
          {formErrors.map((e, i) => (
            <span key={i}>• {e}</span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Branch Name"
          placeholder="e.g. Mumbai Central"
          value={formData.branchName}
          onChange={(e) => onChange(e, "branchName")}
        />
        <Input
          label="Branch Code"
          placeholder="e.g. MUM"
          value={formData.branchCode}
          onChange={(e) => onChange(e, "branchCode")}
        />
      </div>
      <Input
        label="Address"
        placeholder="Full branch address"
        value={formData.address}
        onChange={(e) => onChange(e, "address")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone Number 1 (Required)"
          placeholder="+91 99XXX XXXXX"
          value={formData.phoneNumber1}
          onChange={(e) => onChange(e, "phoneNumber1")}
        />
        <Input
          label="Phone Number 2"
          placeholder="Optional"
          value={formData.phoneNumber2}
          onChange={(e) => onChange(e, "phoneNumber2")}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Phone Number 3"
          placeholder="Optional"
          value={formData.phoneNumber3}
          onChange={(e) => onChange(e, "phoneNumber3")}
        />
        <Input
          label="Phone Number 4"
          placeholder="Optional"
          value={formData.phoneNumber4}
          onChange={(e) => onChange(e, "phoneNumber4")}
        />
        <Input
          label="Phone Number 5"
          placeholder="Optional"
          value={formData.phoneNumber5}
          onChange={(e) => onChange(e, "phoneNumber5")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
        <div className="flex gap-3">
          {(["Active", "Inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                formData.status === s
                  ? s === "Active"
                    ? "bg-emerald-600 border-emerald-500/40 text-white"
                    : "bg-rose-600 border-rose-500/40 text-white"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
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
  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // ── Dashboard state ──
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // ── Management state ──
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    totalRecords: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");

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
     Sub-components
     ============================================================ */

  const StatCard = ({
    label,
    value,
    icon,
    color,
    bgGlow,
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgGlow: string;
  }) => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 group hover:border-slate-700 transition-all duration-300">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${bgGlow}`} />
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );

  /* ============================================================
     Render
     ============================================================ */

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-6 w-full mx-auto relative select-none">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Branches
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-sm">
              Manage transport branch network and operations
            </p>
          </div>
        </header>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6">
          {(
            [
              { id: "dashboard" as TabId, label: "Branch Dashboard", icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              )},
              { id: "management" as TabId, label: "Branch Management", icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              )},
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-violet-600 border-violet-500/40 text-white shadow-lg shadow-violet-500/15"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850/80"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================
            TAB 1 — BRANCH DASHBOARD
            ============================================================ */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {statsLoading && (
              <div className="flex items-center justify-center py-16">
                <svg className="animate-spin h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
            {statsError && (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-center">
                <p className="text-rose-300 text-sm font-semibold">{statsError}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={fetchStats}>
                  Retry
                </Button>
              </div>
            )}
            {stats && !statsLoading && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Branches"
                    value={stats.totalBranches}
                    color="bg-violet-600/20 text-violet-400"
                    bgGlow="bg-violet-500"
                    icon={
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Active Branches"
                    value={stats.activeBranches}
                    color="bg-emerald-600/20 text-emerald-400"
                    bgGlow="bg-emerald-500"
                    icon={
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  <StatCard
                    label="Inactive Branches"
                    value={stats.inactiveBranches}
                    color="bg-rose-600/20 text-rose-400"
                    bgGlow="bg-rose-500"
                    icon={
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    }
                  />
                </div>

                {/* Activity rate bar */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Branch Activity Rate</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                        style={{
                          width: stats.totalBranches > 0
                            ? `${(stats.activeBranches / stats.totalBranches) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-300 w-14 text-right">
                      {stats.totalBranches > 0
                        ? Math.round((stats.activeBranches / stats.totalBranches) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>{stats.activeBranches} Active</span>
                    <span>{stats.inactiveBranches} Inactive</span>
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
          <div className="flex flex-col gap-6">
            {/* Toolbar: Search + Create */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-lg flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search branches by name, code or address..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    }
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-350 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none cursor-pointer shrink-0"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={openCreateModal}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
              >
                Create Branch
              </Button>
            </div>

            {/* Loading state */}
            {branchesLoading && (
              <div className="flex items-center justify-center py-16">
                <svg className="animate-spin h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            {/* Error state */}
            {branchesError && !branchesLoading && (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-center">
                <p className="text-rose-300 text-sm font-semibold">{branchesError}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => fetchBranches()}>
                  Retry
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!branchesLoading && !branchesError && branches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                  <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-semibold">
                  {search ? "No branches found matching your search." : "No branches have been created yet."}
                </p>
                {!search && (
                  <Button variant="primary" size="sm" onClick={openCreateModal}>
                    Create Your First Branch
                  </Button>
                )}
              </div>
            )}

            {/* Branch Cards Grid */}
            {!branchesLoading && !branchesError && branches.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {branches.map((branch) => (
                    <div
                      key={branch.branchId}
                      onClick={() => router.push(`/companies?branchId=${branch.branchId}`)}
                      className="relative rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 flex flex-col gap-4 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-300 group cursor-pointer"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-100 truncate">{branch.branchName}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mt-0.5">
                            {branch.branchCode}
                          </p>
                        </div>
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            branch.status === "Active"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${branch.status === "Active" ? "bg-emerald-400" : "bg-rose-400"}`} />
                          {branch.status}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                          <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                          </svg>
                          <span className="leading-tight">{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <svg className="h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          <span>{branch.phoneNumber1}</span>
                        </div>

                        {/* Stats Section */}
                        <div className="mt-2 pt-3 border-t border-slate-800/60 grid grid-cols-1 gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Companies</span>
                            <span className="font-bold text-slate-200">{branch.stats?.companies ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Company Packages</span>
                            <span className="font-bold text-slate-200">{branch.stats?.companyPackages ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Company Route Rates</span>
                            <span className="font-bold text-slate-200">{branch.stats?.companyRouteRates ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Global Packages</span>
                            <span className="font-bold text-slate-200">{branch.stats?.globalPackages ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Global Route Rates</span>
                            <span className="font-bold text-slate-200">{branch.stats?.globalRouteRates ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                        {/* Status toggle */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(branch); }}
                          disabled={togglingId === branch.branchId}
                          className="relative inline-flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Switch to ${branch.status === "Active" ? "Inactive" : "Active"}`}
                        >
                          <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${branch.status === "Active" ? "bg-emerald-600" : "bg-slate-700"}`}>
                            <div className={`w-3.5 h-3.5 mt-[3px] rounded-full bg-white shadow transition-transform duration-300 ${branch.status === "Active" ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
                          </div>
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {togglingId === branch.branchId ? "..." : branch.status === "Active" ? "ON" : "OFF"}
                          </span>
                        </button>

                        {/* Edit / Delete */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(branch); }}
                            className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteBranch(branch); }}
                            className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Delete"
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

                {/* Pagination */}
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
            <>
              <Button variant="secondary" size="sm" onClick={() => { setCreateOpen(false); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleCreate}>
                Create Branch
              </Button>
            </>
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
          title="Edit Branch"
          size="lg"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setEditBranch(null); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
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
          title={`Delete ${deleteBranch?.branchName || "Branch"}?`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDeleteBranch(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={submitting} onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">
              Deleting this branch will also permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>All companies registered under this branch</li>
              <li>All company/special packages belonging to those companies</li>
              <li>All company route rates belonging to those companies/packages</li>
              <li>All global route rates where this branch is used as the From Branch or To Branch</li>
            </ul>
            <p className="text-rose-400 font-bold mt-2">
              This action cannot be undone.
            </p>
          </div>
        </Modal>

        {/* Inactive Confirmation Modal */}
        <Modal
          isOpen={!!inactiveBranchTarget}
          onClose={() => setInactiveBranchTarget(null)}
          title={`Make ${inactiveBranchTarget?.branchName || "Branch"} Inactive?`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setInactiveBranchTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleConfirmInactive}>
                Make Inactive
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">
              Making this branch inactive will also make the following inactive:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>All companies registered under this branch</li>
              <li>All company/special packages belonging to those companies</li>
              <li>All company route rates belonging to those companies/packages</li>
              <li>All global route rates where this branch is used as the From Branch or To Branch</li>
            </ul>
            <p className="text-emerald-400 font-bold mt-2">
              No data will be deleted.
            </p>
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
    </AdminLayout>
  );
}
