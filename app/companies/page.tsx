"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";

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
}

/* ============================================================
   Company Form Component
   ============================================================ */

function CompanyForm({
  formData,
  formErrors,
  branches,
  onChange,
  onSelectBranch,
  onStatusChange,
}: CompanyFormProps) {
  return (
    <div className="flex flex-col gap-4">
      {formErrors.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium flex flex-col gap-1">
          {formErrors.map((err, i) => (
            <span key={i}>• {err}</span>
          ))}
        </div>
      )}

      {/* Branch Selection */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Branch (Required)
        </label>
        <select
          value={formData.branchId}
          onChange={(e) => onSelectBranch(e.target.value)}
          className="w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((b) => (
            <option key={b.branchId} value={b.branchId}>
              {b.branchName} - {b.branchCode}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Company Name (Required)"
          placeholder="e.g. Acme Logistics"
          value={formData.companyName}
          onChange={(e) => onChange(e, "companyName")}
        />
        <Input
          label="Email (Optional)"
          placeholder="contact@company.com"
          type="email"
          value={formData.email}
          onChange={(e) => onChange(e, "email")}
        />
      </div>

      <Input
        label="Address (Optional)"
        placeholder="Full company address"
        value={formData.address}
        onChange={(e) => onChange(e, "address")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Phone Number 1 (Required)"
          placeholder="+91 99XXX XXXXX"
          value={formData.phoneNumber1}
          onChange={(e) => onChange(e, "phoneNumber1")}
        />
        <Input
          label="Phone Number 2 (Optional)"
          placeholder="Optional"
          value={formData.phoneNumber2}
          onChange={(e) => onChange(e, "phoneNumber2")}
        />
        <Input
          label="Phone Number 3 (Optional)"
          placeholder="Optional"
          value={formData.phoneNumber3}
          onChange={(e) => onChange(e, "phoneNumber3")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="GST Number (Optional)"
          placeholder="e.g. 33AAAAA0000A1Z5"
          value={formData.gstNumber}
          onChange={(e) => onChange(e, "gstNumber")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Status
          </label>
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
}

function SearchableBranchDropdown({
  branches,
  selectedBranchId,
  onSelect,
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
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 cursor-pointer"
      >
        <span className="truncate font-medium">
          {selectedBranch ? `${selectedBranch.branchName} - ${selectedBranch.branchCode}` : "All Branches"}
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
              placeholder="Search branch..."
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
                selectedBranchId === ""
                  ? "bg-violet-600/20 text-violet-300 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              All Branches
            </button>

            {filteredBranches.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching branch found
              </div>
            ) : (
              filteredBranches.map((b) => (
                <button
                  key={b.branchId}
                  type="button"
                  onClick={() => {
                    onSelect(b.branchId);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    selectedBranchId === b.branchId
                      ? "bg-violet-600/20 text-violet-300 font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{b.branchName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {b.branchCode}
                  </span>
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
   Main Page Component
   ============================================================ */

export default function CompaniesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

      // Auto-adjust page if current page is empty after deletion
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
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
        phoneNumber1: formData.phoneNumber1.trim(),
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2.trim();
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3.trim();
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.gstNumber.trim()) body.gstNumber = formData.gstNumber.trim();

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
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
        phoneNumber1: formData.phoneNumber1.trim(),
        status: formData.status,
      };
      if (formData.phoneNumber2.trim()) body.phoneNumber2 = formData.phoneNumber2.trim();
      if (formData.phoneNumber3.trim()) body.phoneNumber3 = formData.phoneNumber3.trim();
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.gstNumber.trim()) body.gstNumber = formData.gstNumber.trim();

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
      // Optional: switch to management tab if not there
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
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: "violet" | "emerald" | "rose" | "amber";
  }) => {
    const colorClasses = {
      violet: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
      emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      rose: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400",
      amber: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
    };

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className={`p-4 rounded-xl border bg-gradient-to-br ${colorClasses[color]} shrink-0`}>
          {icon}
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {label}
          </span>
          <span className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {statsLoading ? "..." : value}
          </span>
        </div>
      </div>
    );
  };

  /* ============================================================
     Render
     ============================================================ */

  return (
    <AdminLayout>
      <div className="flex-1 flex flex-col p-6 w-full mx-auto relative">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 transition-all animate-bounce ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/50 text-rose-200"
            }`}
          >
            {toast.type === "success" ? "✓" : "⚠"} {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center gap-2.5">
              <span className="p-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400">
                🏢
              </span>
              Company Management
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Manage all client companies, branch associations, and operational statuses
            </p>
          </div>

          {/* Create Company Button */}
          <Button variant="primary" size="md" onClick={openCreateModal} className="shrink-0">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Company
          </Button>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 mb-8 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "dashboard"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Company Dashboard
            {activeTab === "dashboard" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("management")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "management"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Company Management
            {activeTab === "management" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {/* ============================================================
            TAB 1: COMPANY DASHBOARD
            ============================================================ */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Companies"
                value={stats.totalCompanies}
                color="violet"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                  </svg>
                }
              />

              <StatCard
                label="Active Companies"
                value={stats.activeCompanies}
                color="emerald"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <StatCard
                label="Inactive Companies"
                value={stats.inactiveCompanies}
                color="rose"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />

              <StatCard
                label="Associated Branches"
                value={stats.totalBranches}
                color="amber"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: COMPANY MANAGEMENT
            ============================================================ */}
        {activeTab === "management" && (
          <div className="flex flex-col gap-6">
            {/* Toolbar Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search by company name..."
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

                {/* Searchable Branch Filter */}
                <SearchableBranchDropdown
                  branches={branches}
                  selectedBranchId={branchFilter}
                  onSelect={(bId) => setBranchFilter(bId)}
                />

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                  className="w-full sm:w-44 text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Status</option>
                  <option value="Inactive">Inactive Status</option>
                </select>
                
                {/* Clear All Filters Button */}
                {(searchInput || branchFilter || statusFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setBranchFilter("");
                      setStatusFilter("All");
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="shrink-0 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {companiesError && (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-rose-300 text-xs font-medium">
                ⚠ {companiesError}
              </div>
            )}

            {/* Loading Grid */}
            {companiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-56 animate-pulse flex flex-col justify-between"
                  >
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-2/3" />
                    </div>
                    <div className="h-8 bg-slate-800 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              /* Empty State */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-4xl mb-3">🏢</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  No Companies Found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {search || branchFilter || statusFilter !== "All"
                    ? "No companies match your search or filter criteria. Try resetting the filters."
                    : "No companies have been added yet. Click 'Create Company' to add one."}
                </p>
                {(search || branchFilter || statusFilter !== "All") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setBranchFilter("");
                      setStatusFilter("All");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              /* Company Cards Grid (9 items per page) */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => (
                    <div
                      key={company.companyId}
                      onClick={() => router.push(`/packages?companyId=${company.companyId}`)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:border-slate-700 hover:bg-slate-800/40 transition-all group relative overflow-hidden cursor-pointer"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide group-hover:text-violet-400 transition-colors">
                              {company.displayName || `${company.companyName} - ${company.branchCode || ""}`}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                              ID: {company.companyId}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              company.status === "Active"
                                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                                : "bg-rose-950/60 border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {company.status}
                          </span>
                        </div>

                        {/* Branch Tag */}
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                            📍 {company.branchName} {company.branchCode ? `(${company.branchCode})` : ""}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                          <p className="flex items-start gap-2 text-slate-400">
                            <span className="shrink-0 text-slate-500">🏠</span>
                            <span className="line-clamp-2">{company.address || "No address provided"}</span>
                          </p>

                          <p className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                            <span className="shrink-0 text-slate-500">📞</span>
                            <span>{company.phoneNumber1}</span>
                            {company.phoneNumber2 && <span className="text-slate-500">| {company.phoneNumber2}</span>}
                          </p>

                          {company.email && (
                            <p className="flex items-center gap-2 text-[11px] text-slate-300">
                              <span className="shrink-0 text-slate-500">✉</span>
                              <span className="truncate">{company.email}</span>
                            </p>
                          )}

                          {company.gstNumber && (
                            <p className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                              <span className="shrink-0 text-slate-500">🧾</span>
                              <span>GST: {company.gstNumber}</span>
                            </p>
                          )}
                        </div>

                        {/* Stats Section */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-1 gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Company Packages</span>
                            <span className="font-bold text-slate-200">{company.stats?.companyPackages ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Company Route Rates</span>
                            <span className="font-bold text-slate-200">{company.stats?.companyRouteRates ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-4 mt-4">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          disabled={togglingId === company.companyId}
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(company); }}
                          className="relative inline-flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Switch to ${company.status === "Active" ? "Inactive" : "Active"}`}
                        >
                          <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${company.status === "Active" ? "bg-emerald-600" : "bg-slate-700"}`}>
                            <div className={`w-3.5 h-3.5 mt-[3px] rounded-full bg-white shadow transition-transform duration-300 ${company.status === "Active" ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
                          </div>
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {togglingId === company.companyId ? "..." : company.status === "Active" ? "ON" : "OFF"}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditModal(company); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-violet-300 hover:bg-violet-950/40 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer"
                            title="Edit Company"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteCompany(company); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Delete Company"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  entityName="companies"
                />
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
            <>
              <Button variant="secondary" size="sm" onClick={() => { setCreateOpen(false); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleCreate}>
                Create Company
              </Button>
            </>
          }
        >
          <CompanyForm
            formData={formData}
            formErrors={formErrors}
            branches={branches}
            onChange={handleTextChange}
            onSelectBranch={(bId) => setFormData((prev) => ({ ...prev, branchId: bId }))}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Edit Company Modal */}
        <Modal
          isOpen={!!editCompany}
          onClose={() => { setEditCompany(null); setFormErrors([]); }}
          title="Edit Company"
          size="lg"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setEditCompany(null); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
          }
        >
          <CompanyForm
            formData={formData}
            formErrors={formErrors}
            branches={branches}
            onChange={handleTextChange}
            onSelectBranch={(bId) => setFormData((prev) => ({ ...prev, branchId: bId }))}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteCompany}
          onClose={() => setDeleteCompany(null)}
          title={`Delete ${deleteCompany?.companyName || "Company"}?`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDeleteCompany(null)}>
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
              Deleting this company will also permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>All packages/special packages belonging to this company</li>
              <li>All company route rates belonging to this company/packages</li>
            </ul>
            <p className="text-rose-400 font-bold mt-2">
              This action cannot be undone.
            </p>
          </div>
        </Modal>

        {/* Inactive Confirmation Modal */}
        <Modal
          isOpen={!!inactiveCompanyTarget}
          onClose={() => setInactiveCompanyTarget(null)}
          title={`Make ${inactiveCompanyTarget?.companyName || "Company"} Inactive?`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setInactiveCompanyTarget(null)}>
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
              Making this company inactive will also make the following inactive:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>{inactiveCompanyTarget?.companyName}</li>
              <li>All packages/special packages belonging to {inactiveCompanyTarget?.companyName}</li>
              <li>All company route rates belonging to {inactiveCompanyTarget?.companyName}/packages</li>
            </ul>
            <p className="text-emerald-400 font-bold mt-2">
              No data will be deleted.
            </p>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

