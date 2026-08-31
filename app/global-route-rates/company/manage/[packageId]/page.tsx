"use client";

import React, { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ packageId: string }>;
}

type ManageTab = "create" | "configured";

/* ============================================================
   Custom Searchable Branch Dropdown Component
   ============================================================ */

interface SearchableBranchDropdownProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  placeholder?: string;
  disabledBranchId?: string;
  isDarkMode: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
  variant?: "form" | "filter";
}

function SearchableBranchDropdown({
  branches,
  selectedBranchId,
  onSelect,
  placeholder = "Select Branch...",
  disabledBranchId,
  isDarkMode,
  allowClear = false,
  clearLabel = "All Branches",
  className = "",
  variant = "form",
}: SearchableBranchDropdownProps) {
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

  const selectedBranch = branches.find((b) => b.branchId === selectedBranchId);

  const availableBranches = branches.filter((b) => !disabledBranchId || b.branchId !== disabledBranchId);

  const filteredBranches = availableBranches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      b.branchName.toLowerCase().includes(q) ||
      (b.branchCode && b.branchCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border active:scale-98 ${
          variant === "form" ? "h-[42px] px-3.5" : "h-[38px] px-3.5"
        } ${
          isDarkMode
            ? "bg-[#121314] hover:bg-[#21262D] border-zinc-700/80 text-zinc-100"
            : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className={`truncate ${!selectedBranch && !allowClear ? "text-slate-400 dark:text-zinc-500" : ""}`}>
            {selectedBranch
              ? `${selectedBranch.branchName} (${selectedBranch.branchCode})`
              : allowClear
              ? clearLabel
              : placeholder}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-amber-500" : isDarkMode ? "text-zinc-400" : "text-slate-400"
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search branch name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs font-bold rounded-lg pl-8 pr-2.5 py-1.5 outline-none border transition-colors ${
                  isDarkMode
                    ? "bg-[#21262D] border-[#30363D] text-[#F0F6FC] placeholder-[#8B949E] focus:border-amber-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500"
                }`}
                autoFocus
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5 max-h-48">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedBranchId === ""
                    ? isDarkMode
                      ? "bg-amber-950/60 text-amber-300 font-extrabold"
                      : "bg-amber-50 text-amber-700 font-extrabold"
                    : isDarkMode
                    ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{clearLabel}</span>
                {selectedBranchId === "" && (
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            )}

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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? "bg-amber-950/60 text-amber-300 font-extrabold"
                          : "bg-amber-50 text-amber-700 font-extrabold"
                        : isDarkMode
                        ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{b.branchName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
                        {b.branchCode}
                      </span>
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
   Custom Status Filter Dropdown Component
   ============================================================ */

interface CustomStatusDropdownProps {
  selectedStatus: "All" | "Active" | "Inactive";
  onSelect: (status: "All" | "Active" | "Inactive") => void;
  isDarkMode: boolean;
}

function CustomStatusDropdown({
  selectedStatus,
  onSelect,
  isDarkMode,
}: CustomStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const options: { value: "All" | "Active" | "Inactive"; label: string; dotColor?: string }[] = [
    { value: "All", label: "All Statuses" },
    { value: "Active", label: "Active Only", dotColor: "bg-emerald-500" },
    { value: "Inactive", label: "Inactive Only", dotColor: "bg-rose-500" },
  ];

  const currentOption = options.find((o) => o.value === selectedStatus) || options[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-[38px] flex items-center justify-between gap-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border active:scale-98 ${
          isDarkMode
            ? "bg-[#121314] hover:bg-[#21262D] border-zinc-700/80 text-zinc-100"
            : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {currentOption.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${currentOption.dotColor}`} />
          )}
          <span className="truncate">{currentOption.label}</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-amber-500" : isDarkMode ? "text-zinc-400" : "text-slate-400"
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
          className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-2xl p-1 z-50 animate-fade-in select-none border ${
            isDarkMode
              ? "bg-[#18191A] border-[#30363D] text-[#F0F6FC]"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {options.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? "bg-amber-950/60 text-amber-300 font-extrabold"
                      : "bg-amber-50 text-amber-700 font-extrabold"
                    : isDarkMode
                    ? "text-[#C9D1D9] hover:bg-[#21262D] hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.dotColor && <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />}
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Main Page Component
   ============================================================ */

export default function ManageCompanyRouteRatesPage({ params }: PageProps) {
  const { packageId } = use(params);
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const [activeTab, setActiveTab] = useState<ManageTab>("create");

  const [pkg, setPkg] = useState<Package | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [routes, setRoutes] = useState<CompanyRouteRate[]>([]);
  const [fromBranch, setFromBranch] = useState<Branch | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state for Configured Routes
  const [rateSearch, setRateSearch] = useState("");
  const [fromBranchFilter, setFromBranchFilter] = useState("");
  const [toBranchFilter, setToBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Pagination state for configured routes
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  // Form state
  const [companySide, setCompanySide] = useState<"FROM" | "TO">("FROM");
  const [selectedFromBranchId, setSelectedFromBranchId] = useState("");
  const [selectedToBranchId, setSelectedToBranchId] = useState("");
  const [transportRateInput, setTransportRateInput] = useState("");
  const [pickupChargeInput, setPickupChargeInput] = useState("0");
  const [deliveryChargeInput, setDeliveryChargeInput] = useState("0");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal state
  const [editRoute, setEditRoute] = useState<CompanyRouteRate | null>(null);
  const [editCompanySide, setEditCompanySide] = useState<"FROM" | "TO">("FROM");
  const [editFromBranchId, setEditFromBranchId] = useState("");
  const [editToBranchId, setEditToBranchId] = useState("");
  const [editTransportRate, setEditTransportRate] = useState("");
  const [editPickupCharge, setEditPickupCharge] = useState("");
  const [editDeliveryCharge, setEditDeliveryCharge] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");
  const [deleteRoute, setDeleteRoute] = useState<CompanyRouteRate | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ============================================================
     API Calls
     ============================================================ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Load package
      const pkgRes = await fetch(`/api/packages/${packageId}`);
      const pkgJson = await pkgRes.json();
      if (!pkgRes.ok) throw new Error(pkgJson.message || "Failed to load package.");
      setPkg(pkgJson);

      // 2. Load all branches
      const bRes = await fetch("/api/branches?limit=100");
      const bJson = await bRes.json();
      let allBranches: Branch[] = [];
      if (bJson.success && Array.isArray(bJson.data)) {
        allBranches = bJson.data;
        setBranches(allBranches);
      }

      // 3. Load company data if companyId is present
      if (pkgJson.companyId) {
        const compRes = await fetch(`/api/companies/${pkgJson.companyId}`);
        const compJson = await compRes.json();
        if (compRes.ok) {
          setCompany(compJson);
          const fBranch = allBranches.find(
            (b) => b.branchId === compJson.branchId || b.branchName === compJson.branchName
          );
          if (fBranch) setFromBranch(fBranch);
        }
      }

      // 4. Load configured company route rates
      let url = `/api/company-route-rates?packageId=${packageId}`;
      if (pkgJson.companyId) {
        url += `&companyId=${encodeURIComponent(pkgJson.companyId)}`;
      }
      const rRes = await fetch(url);
      const rJson = await rRes.json();
      if (rJson.companyRouteRates && Array.isArray(rJson.companyRouteRates)) {
        setRoutes(rJson.companyRouteRates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page data.");
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [rateSearch, fromBranchFilter, toBranchFilter, statusFilter]);

  // Create Company Route Rate: POST /api/company-route-rates
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!pkg || !pkg.companyId) {
      setFormError("Package has no associated company.");
      return;
    }
    if (!fromBranch) {
      setFormError("Could not determine company's registered branch.");
      return;
    }

    const actualFromBranchId = companySide === "FROM" ? fromBranch.branchId : selectedFromBranchId;
    const actualToBranchId = companySide === "TO" ? fromBranch.branchId : selectedToBranchId;

    if (!actualFromBranchId) {
      setFormError("Please select From Branch.");
      return;
    }
    if (!actualToBranchId) {
      setFormError("Please select To Branch.");
      return;
    }
    if (actualFromBranchId === actualToBranchId) {
      setFormError("Source Branch and Destination Branch cannot be the same.");
      return;
    }

    // Branch Registration Validation
    if (companySide === "FROM" && actualFromBranchId !== fromBranch.branchId) {
      setFormError("Company is not registered under the selected From Branch.");
      return;
    }
    if (companySide === "TO" && actualToBranchId !== fromBranch.branchId) {
      setFormError("Company is not registered under the selected To Branch.");
      return;
    }

    const tRate = Number(transportRateInput);
    const pCharge = Number(pickupChargeInput) || 0;
    const dCharge = Number(deliveryChargeInput) || 0;

    if (isNaN(tRate) || tRate < 0) {
      setFormError("Please enter a valid Transport Rate.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company-route-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: pkg.companyId,
          companyName: pkg.companyName || company?.companyName || "",
          companySide,
          fromBranchId: actualFromBranchId,
          toBranchId: actualToBranchId,
          packageId: pkg.packageId,
          packageName: pkg.packageName,
          transportRate: tRate,
          pickupCharge: pCharge,
          deliveryCharge: dCharge,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create company route rate.");

      showToast("Company route rate created successfully!");
      setSelectedFromBranchId("");
      setSelectedToBranchId("");
      setTransportRateInput("");
      setPickupChargeInput("0");
      setDeliveryChargeInput("0");
      setStatus("Active");
      await loadData();
      setActiveTab("configured");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create company route rate.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Company Route Rate: PUT /api/company-route-rates/[companyRouteRateId]
  const handleUpdateRoute = async () => {
    if (!editRoute) return;
    const tRate = Number(editTransportRate);
    const pCharge = Number(editPickupCharge) || 0;
    const dCharge = Number(editDeliveryCharge) || 0;

    if (isNaN(tRate) || tRate < 0) {
      showToast("Please enter a valid Transport Rate.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/company-route-rates/${editRoute.companyRouteRateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: editRoute.companyId,
          companySide: editCompanySide,
          fromBranchId: editFromBranchId || editRoute.fromBranchId,
          toBranchId: editToBranchId || editRoute.toBranchId,
          packageId: editRoute.packageId,
          transportRate: tRate,
          pickupCharge: pCharge,
          deliveryCharge: dCharge,
          status: editStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update company route rate.");

      showToast("Company route rate updated successfully!");
      setEditRoute(null);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update route rate.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Company Route Rate: DELETE /api/company-route-rates/[companyRouteRateId]
  const handleDeleteRoute = async () => {
    if (!deleteRoute) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/company-route-rates/${deleteRoute.companyRouteRateId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete route rate.");

      showToast("Company route rate deleted successfully!");
      setDeleteRoute(null);
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete route rate.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setRateSearch("");
    setFromBranchFilter("");
    setToBranchFilter("");
    setStatusFilter("All");
    setPage(1);
  };

  /* ============================================================
     Filtering & Pagination Pipeline
     ============================================================ */

  const filteredRoutes = routes.filter((r) => {
    if (rateSearch.trim()) {
      const q = rateSearch.trim();
      const matchesTransport = String(r.transportRate).includes(q);
      const matchesPickup = String(r.pickupCharge).includes(q);
      const matchesDelivery = String(r.deliveryCharge).includes(q);
      if (!matchesTransport && !matchesPickup && !matchesDelivery) return false;
    }
    if (fromBranchFilter && r.fromBranchId !== fromBranchFilter) {
      return false;
    }
    if (toBranchFilter && r.toBranchId !== toBranchFilter) {
      return false;
    }
    if (statusFilter !== "All" && r.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalRecords = filteredRoutes.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * limit;
  const paginatedRoutes = filteredRoutes.slice(startIdx, startIdx + limit);

  const activeRoutesCount = routes.filter((r) => r.status === "Active").length;
  const inactiveRoutesCount = routes.filter((r) => r.status === "Inactive").length;

  const currentTransport = Number(transportRateInput) || 0;
  const currentPickup = Number(pickupChargeInput) || 0;
  const currentDelivery = Number(deliveryChargeInput) || 0;
  const totalCalculatedRate = currentTransport + currentPickup + currentDelivery;

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

        {/* Top Header Row: Back Link (Left) + Tab Control (Right) */}
        <div className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          {/* Back link */}
          <Link
            href="/global-route-rates?tab=company"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-amber-600 dark:hover:text-amber-400 shadow-2xs self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Route Rates</span>
          </Link>

          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "create"
                  ? "bg-amber-600 dark:bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Company Rate</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("configured")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "configured"
                  ? "bg-amber-600 dark:bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span>Configured Routes ({routes.length})</span>
            </button>
          </div>
        </div>

        {/* Package Context Banner Card */}
        <div
          className="shrink-0 mb-4 rounded-2xl p-4 md:p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none shadow-xs"
          style={{
            background: isDarkMode ? "#242526" : "#FFFFFF",
            borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 truncate">
                  {pkg ? pkg.packageName : "Loading Package..."}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                  COMPANY PACKAGE
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                <span>
                  Client: <strong className="text-slate-800 dark:text-zinc-200 font-bold">{pkg?.companyName || company?.companyName || "Client"}</strong>
                </span>
                <span>•</span>
                <span>
                  Registered Branch:{" "}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">
                    {fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "Loading..."}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Micro-Stats Bento */}
          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
            <div className="px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Routes</span>
              <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{routes.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{activeRoutesCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl border bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Inactive</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">{inactiveRoutesCount}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
              <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}>
                Loading company route rates...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-2xl p-8 text-center max-w-xl mx-auto my-4 w-full"
              style={
                isDarkMode
                  ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
                  : { background: "#fff5f5", border: "1px solid rgba(239,68,68,0.2)" }
              }
            >
              <p className="text-sm font-semibold mb-4" style={{ color: "#EF4444" }}>
                {error}
              </p>
              <Button variant="secondary" size="sm" onClick={() => loadData()}>
                Retry Loading
              </Button>
            </div>
          ) : (
            <>
              {/* ============================================================
                  TAB 1: ADD COMPANY ROUTE RATE FORM
                  ============================================================ */}
              {activeTab === "create" && (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
                  <div
                    className="max-w-2xl mx-auto rounded-2xl p-6 border shadow-xs flex flex-col gap-5 select-none"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                          Create Corporate Client Tariff
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Configure customized transport pricing, pickup, and delivery charges for this client.
                        </p>
                      </div>
                    </div>

                    {formError && (
                      <div
                        className="rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border"
                        style={
                          isDarkMode
                            ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#FCA5A5" }
                            : { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }
                        }
                      >
                        <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{formError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateRoute} className="flex flex-col gap-4">
                      {/* Company Direction Side */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                          Client Consignment Direction <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(["FROM", "TO"] as const).map((side) => {
                            const isSelected = companySide === side;
                            return (
                              <button
                                key={side}
                                type="button"
                                onClick={() => {
                                  setCompanySide(side);
                                  setFormError("");
                                }}
                                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                                    : isDarkMode
                                    ? "bg-[#121314] hover:bg-[#252627] text-zinc-400 border-zinc-800"
                                    : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                <span>{side === "FROM" ? "Outbound (From Client)" : "Inbound (To Client)"}</span>
                                <span className={`text-[9.5px] font-medium ${isSelected ? "text-amber-100" : "text-slate-400 dark:text-zinc-500"}`}>
                                  {side === "FROM" ? "Sender is Client" : "Receiver is Client"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Branch Inputs */}
                      {companySide === "FROM" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                              Source Branch (Client Branch)
                            </label>
                            <input
                              type="text"
                              disabled
                              value={fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "N/A"}
                              className="w-full h-[42px] text-xs font-bold rounded-xl px-3.5 border bg-slate-100 dark:bg-zinc-900/60 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-zinc-800 cursor-not-allowed flex items-center"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                              Destination Branch <span className="text-rose-500">*</span>
                            </label>
                            <SearchableBranchDropdown
                              branches={branches}
                              selectedBranchId={selectedToBranchId}
                              onSelect={(bId) => setSelectedToBranchId(bId)}
                              disabledBranchId={fromBranch?.branchId}
                              placeholder="Search & select destination..."
                              isDarkMode={isDarkMode}
                              variant="form"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                              Source Branch <span className="text-rose-500">*</span>
                            </label>
                            <SearchableBranchDropdown
                              branches={branches}
                              selectedBranchId={selectedFromBranchId}
                              onSelect={(bId) => setSelectedFromBranchId(bId)}
                              disabledBranchId={fromBranch?.branchId}
                              placeholder="Search & select source branch..."
                              isDarkMode={isDarkMode}
                              variant="form"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                              Destination Branch (Client Branch)
                            </label>
                            <input
                              type="text"
                              disabled
                              value={fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "N/A"}
                              className="w-full h-[42px] text-xs font-bold rounded-xl px-3.5 border bg-slate-100 dark:bg-zinc-900/60 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-zinc-800 cursor-not-allowed flex items-center"
                            />
                          </div>
                        </div>
                      )}

                      {/* Pricing 3-Column Bento Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Transport Rate (₹) *"
                          placeholder="e.g. 2500"
                          type="number"
                          value={transportRateInput}
                          onChange={(e) => setTransportRateInput(e.target.value)}
                        />
                        <Input
                          label="Pickup Charge (₹)"
                          placeholder="e.g. 50"
                          type="number"
                          value={pickupChargeInput}
                          onChange={(e) => setPickupChargeInput(e.target.value)}
                        />
                        <Input
                          label="Delivery Charge (₹)"
                          placeholder="e.g. 30"
                          type="number"
                          value={deliveryChargeInput}
                          onChange={(e) => setDeliveryChargeInput(e.target.value)}
                        />
                      </div>

                      {/* Calculated Total Price Bento Banner */}
                      <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                            Calculated Tariff Total
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                            (Base ₹{currentTransport} + Pickup ₹{currentPickup} + Delivery ₹{currentDelivery})
                          </span>
                        </div>
                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                          ₹{totalCalculatedRate}
                        </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                          Operational Status
                        </label>
                        <div className="flex items-center gap-3">
                          {(["Active", "Inactive"] as const).map((s) => {
                            const isSelected = status === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
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

                      <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {submitting && (
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        <span>{submitting ? "Creating Tariff..." : "Create Company Route Tariff"}</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 2: CONFIGURED ROUTES TABLE & FILTERS & PAGINATION
                  ============================================================ */}
              {activeTab === "configured" && (
                <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden select-none">
                  {/* Filters Toolbar */}
                  <div
                    className="shrink-0 p-3.5 rounded-2xl border flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shadow-2xs"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {/* Search by Rate */}
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Search rate or charges..."
                          value={rateSearch}
                          onChange={(e) => setRateSearch(e.target.value)}
                          className={`w-full h-[38px] text-xs font-bold rounded-xl pl-9 pr-3 outline-none border transition-all shadow-2xs ${
                            isDarkMode
                              ? "bg-[#121314] hover:bg-[#21262D]/50 focus:bg-[#121314] border-zinc-700/80 focus:border-amber-500 text-zinc-100 placeholder:text-zinc-500"
                              : "bg-white hover:bg-slate-50 focus:bg-white border-slate-300 focus:border-amber-500 text-slate-800 placeholder:text-slate-400"
                          }`}
                        />
                        <svg
                          className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>

                      {/* From Branch Searchable Filter */}
                      <SearchableBranchDropdown
                        branches={branches}
                        selectedBranchId={fromBranchFilter}
                        onSelect={(bId) => {
                          setFromBranchFilter(bId);
                          if (bId && bId === toBranchFilter) setToBranchFilter("");
                        }}
                        disabledBranchId={toBranchFilter}
                        placeholder="All Source Branches"
                        allowClear={true}
                        clearLabel="All Source Branches"
                        isDarkMode={isDarkMode}
                        variant="filter"
                      />

                      {/* To Branch Searchable Filter */}
                      <SearchableBranchDropdown
                        branches={branches}
                        selectedBranchId={toBranchFilter}
                        onSelect={(bId) => {
                          setToBranchFilter(bId);
                          if (bId && bId === fromBranchFilter) setFromBranchFilter("");
                        }}
                        disabledBranchId={fromBranchFilter}
                        placeholder="All Destination Branches"
                        allowClear={true}
                        clearLabel="All Destination Branches"
                        isDarkMode={isDarkMode}
                        variant="filter"
                      />

                      {/* Status Custom Dropdown */}
                      <CustomStatusDropdown
                        selectedStatus={statusFilter}
                        onSelect={(s) => setStatusFilter(s)}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {(rateSearch || fromBranchFilter || toBranchFilter || statusFilter !== "All") && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="h-[38px] text-xs font-bold px-3.5 rounded-xl border bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 transition-all shrink-0 cursor-pointer flex items-center justify-center whitespace-nowrap"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Empty State */}
                  {filteredRoutes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-8 shadow-xs">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l3-3m-3 3l-3-3" />
                        </svg>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-400 text-sm font-semibold">
                        {routes.length === 0
                          ? "No company routes configured for this package yet."
                          : "No company routes match your selected filter criteria."}
                      </p>
                      {routes.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab("create")}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          Add Client Tariff
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Modern Table Container */}
                      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#242526] shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/80 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 bg-slate-50/80 dark:bg-zinc-900/60 sticky top-0 z-10 backdrop-blur-xs">
                              <th className="py-3 px-4">#</th>
                              <th className="py-3 px-4">Side</th>
                              <th className="py-3 px-4">Source Branch</th>
                              <th className="py-3 px-4">Destination Branch</th>
                              <th className="py-3 px-4">Transport</th>
                              <th className="py-3 px-4">Pickup</th>
                              <th className="py-3 px-4">Delivery</th>
                              <th className="py-3 px-4">Total Tariff</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                            {paginatedRoutes.map((r, i) => {
                              const routeTotal = (Number(r.transportRate) || 0) + (Number(r.pickupCharge) || 0) + (Number(r.deliveryCharge) || 0);
                              return (
                                <tr key={r.companyRouteRateId} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                  <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-zinc-500">
                                    {startIdx + i + 1}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/40">
                                      {r.companySide || "FROM"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                      <span>{r.fromBranchName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                      <span>{r.toBranchName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-zinc-200">
                                    ₹{r.transportRate}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400">
                                    ₹{r.pickupCharge || 0}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400">
                                    ₹{r.deliveryCharge || 0}
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                    ₹{routeTotal}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                                        r.status === "Active"
                                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                      {r.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditRoute(r);
                                          setEditCompanySide(r.companySide || "FROM");
                                          setEditFromBranchId(r.fromBranchId);
                                          setEditToBranchId(r.toBranchId);
                                          setEditTransportRate(String(r.transportRate));
                                          setEditPickupCharge(String(r.pickupCharge));
                                          setEditDeliveryCharge(String(r.deliveryCharge));
                                          setEditStatus(r.status);
                                        }}
                                        className="p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-amber-950/40 text-slate-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all cursor-pointer shadow-2xs"
                                        title="Edit Route Rate"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteRoute(r)}
                                        className="p-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer shadow-2xs"
                                        title="Delete Route Rate"
                                      >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pinned Pagination Bar */}
                      <div
                        className="shrink-0 pt-2 pb-1 border-t"
                        style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}
                      >
                        <Pagination
                          page={currentPage}
                          totalPages={totalPages}
                          onPageChange={(newPage) => setPage(newPage)}
                          limit={limit}
                          onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setPage(1);
                          }}
                          totalRecords={totalRecords}
                          limitOptions={[9, 18, 27, 45, 90]}
                          entityName="routes"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editRoute}
          onClose={() => setEditRoute(null)}
          title="Edit Company Route Rate"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setEditRoute(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdateRoute}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-amber-600 hover:bg-amber-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 text-xs select-none">
            <div
              className="p-3 rounded-xl border flex flex-col gap-1.5"
              style={{
                background: isDarkMode ? "#1C1D1E" : "#F8FAFC",
                borderColor: isDarkMode ? "#2D3139" : "#E2E8F0",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Client</span>
                <span className="text-xs font-black text-slate-900 dark:text-zinc-100">{editRoute?.companyName}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Package</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{editRoute?.packageName}</span>
              </div>
            </div>

            {/* Company Side in Edit Modal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Client Direction Side
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["FROM", "TO"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setEditCompanySide(side)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editCompanySide === side
                        ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                        : isDarkMode
                        ? "bg-[#121314] hover:bg-[#252627] text-zinc-400 border-zinc-800"
                        : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {side === "FROM" ? "FROM (Sender)" : "TO (Receiver)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Source Branch
                </label>
                <SearchableBranchDropdown
                  branches={branches}
                  selectedBranchId={editFromBranchId}
                  onSelect={(bId) => setEditFromBranchId(bId)}
                  placeholder="Select source branch..."
                  isDarkMode={isDarkMode}
                  variant="form"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Destination Branch
                </label>
                <SearchableBranchDropdown
                  branches={branches}
                  selectedBranchId={editToBranchId}
                  onSelect={(bId) => setEditToBranchId(bId)}
                  disabledBranchId={editFromBranchId}
                  placeholder="Select destination branch..."
                  isDarkMode={isDarkMode}
                  variant="form"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Transport Rate (₹) *"
                type="number"
                value={editTransportRate}
                onChange={(e) => setEditTransportRate(e.target.value)}
              />
              <Input
                label="Pickup Charge (₹)"
                type="number"
                value={editPickupCharge}
                onChange={(e) => setEditPickupCharge(e.target.value)}
              />
              <Input
                label="Delivery Charge (₹)"
                type="number"
                value={editDeliveryCharge}
                onChange={(e) => setEditDeliveryCharge(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Operational Status
              </label>
              <div className="flex gap-3">
                {(["Active", "Inactive"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStatus(s)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      editStatus === s
                        ? s === "Active"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-rose-600 border-rose-600 text-white shadow-xs"
                        : isDarkMode
                        ? "bg-[#121314] hover:bg-[#252627] text-zinc-400 border-zinc-800"
                        : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${editStatus === s ? "bg-white" : s === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteRoute}
          onClose={() => setDeleteRoute(null)}
          title="Delete Company Route Rate"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDeleteRoute(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteRoute}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-rose-600 hover:bg-rose-500 text-white shadow-xs disabled:opacity-50 active:scale-95"
              >
                {submitting && (
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{submitting ? "Deleting..." : "Delete Route"}</span>
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2 select-none text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
              Are you sure you want to permanently delete the custom tariff for{" "}
              <strong className="text-rose-900 dark:text-rose-100">
                {deleteRoute?.companyName} ({deleteRoute?.fromBranchName} → {deleteRoute?.toBranchName})
              </strong>
              ?
            </div>
            <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
              This action cannot be undone and will affect live booking tariff calculations for this client.
            </p>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
