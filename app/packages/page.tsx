"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";

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
}

function SearchableCompanyDropdown({
  companies,
  selectedCompanyId,
  onSelect,
  allowAll = false,
  label,
  required = false,
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
    <div className="flex flex-col gap-1.5 w-full relative" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label} {required && "(Required)"}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 cursor-pointer"
      >
        <span className="truncate font-medium">
          {selectedCompany
            ? `${selectedCompany.companyName} (${selectedCompany.branchCode || selectedCompany.branchName})`
            : allowAll
            ? "All Companies"
            : "-- Select Company --"}
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
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-64">
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
            {allowAll && (
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
            )}

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
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, field: keyof PackageFormData) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>, field: keyof PackageFormData) => void;
  onMouseDown: (e: React.MouseEvent<HTMLInputElement>, field: keyof PackageFormData) => void;
  onStatusChange: (status: "Active" | "Inactive") => void;
}

function PackageForm({
  isEdit,
  formData,
  formErrors,
  companies,
  onChange,
  onSelectCompany,
  onScopeChange,
  onKeyDown,
  onFocus,
  onMouseDown,
  onStatusChange,
}: PackageFormProps) {
  return (
    <div className="flex flex-col gap-4">
      {formErrors.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium flex flex-col gap-1">
          {formErrors.map((err, i) => (
            <span key={i}>• {err}</span>
          ))}
        </div>
      )}

      {/* Scope Switch: ONLY VISIBLE DURING CREATE */}
      {!isEdit ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Package Type
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => onScopeChange("GLOBAL")}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                formData.scope === "GLOBAL"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              GLOBAL PACKAGE
            </button>

            <button
              type="button"
              onClick={() => onScopeChange("COMPANY")}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                formData.scope === "COMPANY"
                  ? "bg-amber-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              COMPANY PACKAGE
            </button>
          </div>
        </div>
      ) : (
        /* Display Package Type Badge during Edit */
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Package Type:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              formData.scope === "GLOBAL"
                ? "bg-violet-950/60 border-violet-500/30 text-violet-400"
                : "bg-amber-950/60 border-amber-500/30 text-amber-400"
            }`}
          >
            {formData.scope} PACKAGE
          </span>
        </div>
      )}

      {/* Package Name Input */}
      <Input
        label="Package Name (Required)"
        placeholder="e.g. Box 4x4, Roll, Machine Parts"
        value={formData.packageName}
        onChange={(e) => onChange(e, "packageName")}
        onKeyDown={(e) => onKeyDown(e, "packageName")}
        onFocus={(e) => onFocus(e, "packageName")}
        onMouseDown={(e) => onMouseDown(e, "packageName")}
      />

      {/* Company Selection: ONLY SHOW IF SCOPE IS COMPANY */}
      {formData.scope === "COMPANY" && (
        <SearchableCompanyDropdown
          companies={companies}
          selectedCompanyId={formData.companyId}
          onSelect={onSelectCompany}
          label="Associated Company"
          required
        />
      )}

      {/* Description Input */}
      <Input
        label="Description (Optional)"
        placeholder="e.g. Small carton box for electronics"
        value={formData.description}
        onChange={(e) => onChange(e, "description")}
        onKeyDown={(e) => onKeyDown(e, "description")}
        onFocus={(e) => onFocus(e, "description")}
        onMouseDown={(e) => onMouseDown(e, "description")}
      />

      {/* Status Radio Buttons */}
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
  );
}

/* ============================================================
   Main Page Component
   ============================================================ */

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("management");

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
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState("");

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  const [deletePackage, setDeletePackage] = useState<Package | null>(null);
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

  /* ============================================================
     API Calls
     ============================================================ */

  // Load companies list for dropdowns
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

  // Fetch all packages to compute live dashboard statistics
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

  // Fetch paginated packages: GET /api/packages?page=&limit=&search=&companyId=&status=
  const fetchPackages = useCallback(async (p?: number, l?: number, s?: string, cId?: string, st?: string) => {
    const pg = p ?? pagination.page;
    const lm = l ?? pagination.limit;
    const sr = s ?? search;
    const compVal = cId ?? companyFilter;
    const stVal = st ?? statusFilter;

    setPackagesLoading(true);
    setPackagesError("");
    try {
      const params = new URLSearchParams({
        page: String(pg),
        limit: String(lm),
      });
      if (sr.trim()) params.set("search", sr.trim());
      if (compVal.trim()) params.set("companyId", compVal.trim());
      if (stVal !== "All") params.set("status", stVal);

      const res = await fetch(`/api/packages?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch packages.");
      }

      const pkgArray: Package[] = json.packages || [];
      const totalRecs = json.totalPackages ?? pkgArray.length;
      const totalPgs = json.totalPages ?? Math.ceil(totalRecs / lm);

      // Auto-adjust page if current page is empty after deletion
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

  // Create package: POST /api/packages
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
        packageName: formData.packageName.trim(),
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

  // Update package: PUT /api/packages/[packageId]
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
        packageName: formData.packageName.trim(),
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

  // Delete package: DELETE /api/packages/[packageId]
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

  // Toggle status: PUT /api/packages/[packageId] with toggled status
  const handleToggleStatus = async (pkg: Package) => {
    setTogglingId(pkg.packageId);
    try {
      const newStatus = pkg.status === "Active" ? "Inactive" : "Active";
      const res = await fetch(`/api/packages/${pkg.packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: pkg.packageName,
          description: pkg.description || "",
          status: newStatus,
          ...(pkg.companyId ? { companyId: pkg.companyId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update package status.");

      showToast(`Package status changed to ${newStatus}.`);
      fetchPackages();
      fetchStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change status.", "error");
    } finally {
      setTogglingId(null);
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
  }, [statusFilter, companyFilter]);

  // Synchronous focus lock for space key on inputs
  const lockedFieldsRef = useRef<Record<string, boolean>>({});

  const openEditModal = (pkg: Package) => {
    lockedFieldsRef.current = {};
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
    lockedFieldsRef.current = {};
    setFormData(emptyForm);
    setFormErrors([]);
    setCreateOpen(true);
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof PackageFormData
  ) => {
    let val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: keyof PackageFormData
  ) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      lockedFieldsRef.current[field] = true;
      let val = (formData[field] || "") + " ";
      setFormData((prev) => ({ ...prev, [field]: val }));
      e.currentTarget.blur();
    }
  };

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    field: keyof PackageFormData
  ) => {
    if (lockedFieldsRef.current[field]) {
      e.currentTarget.blur();
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLInputElement>,
    field: keyof PackageFormData
  ) => {
    lockedFieldsRef.current[field] = false;
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
    color: "violet" | "emerald" | "rose" | "indigo" | "amber";
  }) => {
    const colorClasses = {
      violet: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400",
      emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      rose: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400",
      indigo: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400",
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
                📦
              </span>
              TMS Package Management
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Manage global package types, company-specific packages, and operational statuses
            </p>
          </div>

          {/* Create Package Button */}
          <Button variant="primary" size="md" onClick={openCreateModal} className="shrink-0">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Package
          </Button>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 mb-8 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("management")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "management"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Package Management
            {activeTab === "management" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "dashboard"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Package Dashboard
            {activeTab === "dashboard" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {/* ============================================================
            TAB 1: PACKAGE DASHBOARD
            ============================================================ */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                label="Total Packages"
                value={stats.totalPackages}
                color="violet"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />

              <StatCard
                label="Active Packages"
                value={stats.activePackages}
                color="emerald"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <StatCard
                label="Inactive Packages"
                value={stats.inactivePackages}
                color="rose"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />

              <StatCard
                label="Global Packages"
                value={stats.globalPackages}
                color="indigo"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <StatCard
                label="Company Packages"
                value={stats.companyPackages}
                color="amber"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: PACKAGE MANAGEMENT
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

                {/* Searchable Company Filter */}
                <div className="w-full sm:w-64">
                  <SearchableCompanyDropdown
                    companies={companies}
                    selectedCompanyId={companyFilter}
                    onSelect={(cId) => setCompanyFilter(cId)}
                    allowAll
                  />
                </div>

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
              </div>
            </div>

            {/* Error Message */}
            {packagesError && (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-rose-300 text-xs font-medium">
                ⚠ {packagesError}
              </div>
            )}

            {/* Loading Grid */}
            {packagesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between"
                  >
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800 rounded w-3/4" />
                    </div>
                    <div className="h-8 bg-slate-800 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : packages.length === 0 ? (
              /* Empty State */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-4xl mb-3">📦</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  No Packages Found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {search || companyFilter || statusFilter !== "All"
                    ? "No packages match your search or filter criteria. Try resetting the filters."
                    : "No packages have been added yet. Click 'Create Package' to add one."}
                </p>
                {(search || companyFilter || statusFilter !== "All") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setCompanyFilter("");
                      setStatusFilter("All");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              /* Package Cards Grid (9 items per page) */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.packageId}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all group relative overflow-hidden"
                    >
                      {/* Top Header */}
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

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                              pkg.status === "Active"
                                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                                : "bg-rose-950/60 border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {pkg.status}
                          </span>
                        </div>

                        {/* Package Scope & Company Badge */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          {/* GLOBAL vs COMPANY Badge */}
                          {!pkg.companyId ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-violet-950/60 border border-violet-500/40 text-violet-300">
                              🌐 GLOBAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-950/60 border border-amber-500/40 text-amber-300">
                              🏢 COMPANY
                            </span>
                          )}

                          {/* Company Name Tag */}
                          {pkg.companyId && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                              {pkg.companyName || "Company Package"}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div className="text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                          <p className="text-slate-400 text-xs line-clamp-2">
                            {pkg.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-4 mt-4">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          disabled={togglingId === pkg.packageId}
                          onClick={() => handleToggleStatus(pkg)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                            pkg.status === "Active"
                              ? "bg-slate-950 border-amber-500/30 text-amber-400 hover:bg-amber-950/30"
                              : "bg-slate-950 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30"
                          }`}
                        >
                          {togglingId === pkg.packageId
                            ? "Updating..."
                            : pkg.status === "Active"
                            ? "Set Inactive"
                            : "Set Active"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(pkg)}
                            className="p-2 rounded-xl text-slate-400 hover:text-violet-300 hover:bg-violet-950/40 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer"
                            title="Edit Package"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletePackage(pkg)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Delete Package"
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
                  entityName="packages"
                />
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
            <>
              <Button variant="secondary" size="sm" onClick={() => { setCreateOpen(false); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleCreate}>
                Create Package
              </Button>
            </>
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
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Edit Package Modal */}
        <Modal
          isOpen={!!editPackage}
          onClose={() => { setEditPackage(null); setFormErrors([]); }}
          title={`Edit ${editPackage?.companyId ? "Company" : "Global"} Package`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => { setEditPackage(null); setFormErrors([]); }}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
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
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            onStatusChange={(status) => setFormData((prev) => ({ ...prev, status }))}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deletePackage}
          onClose={() => setDeletePackage(null)}
          title="Delete Package"
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDeletePackage(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={submitting} onClick={handleDelete}>
                Delete Package
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-slate-300 text-xs">
            <p>
              Are you sure you want to delete{" "}
              <strong className="text-slate-100 font-bold">
                {deletePackage?.packageName}
              </strong>
              ?
            </p>
            <p className="text-[11px] text-rose-450 font-medium">
              This action cannot be undone. Any shipments referencing this package type will retain historical records.
            </p>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
