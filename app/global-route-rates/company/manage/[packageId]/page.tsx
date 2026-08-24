"use client";

import React, { useState, useEffect, useCallback, use } from "react";
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

interface PageProps {
  params: Promise<{ packageId: string }>;
}

type ManageTab = "create" | "configured";

export default function ManageCompanyRouteRatesPage({ params }: PageProps) {
  const { packageId } = use(params);

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
          // Find From Branch matching company's branch
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
      setFormError("From Branch and To Branch cannot be the same.");
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
      setActiveTab("configured"); // Automatically switch to configured routes tab!
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
    // 1. Search by Rate (matches transportRate, pickupCharge, or deliveryCharge)
    if (rateSearch.trim()) {
      const q = rateSearch.trim();
      const matchesTransport = String(r.transportRate).includes(q);
      const matchesPickup = String(r.pickupCharge).includes(q);
      const matchesDelivery = String(r.deliveryCharge).includes(q);
      if (!matchesTransport && !matchesPickup && !matchesDelivery) return false;
    }
    // 2. From Branch Filter
    if (fromBranchFilter && r.fromBranchId !== fromBranchFilter) {
      return false;
    }
    // 3. To Branch Filter
    if (toBranchFilter && r.toBranchId !== toBranchFilter) {
      return false;
    }
    // 4. Status Filter
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

  /* ============================================================
     Render
     ============================================================ */

  return (
    <Layout>
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

        {/* Navigation Back Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/global-route-rates"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
          >
            ← Back to Route Rates 
          </Link>
        </div>

        {/* Read-only Context Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-1.5 bg-amber-600/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
                🏢
              </span>
              <h1 className="text-lg font-black uppercase tracking-wider text-slate-100">
                {pkg ? pkg.packageName : "Loading Package..."}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-950/60 border border-amber-500/30 text-amber-400">
                COMPANY PACKAGE
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono mt-2">
              <span>
                Company:{" "}
                <strong className="text-slate-200">
                  {pkg?.companyName || company?.companyName || "N/A"} ({pkg?.companyId})
                </strong>
              </span>
              <span>•</span>
              <span>
                From Branch (Home):{" "}
                <strong className="text-amber-400">
                  {fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "Loading Branch..."}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 mb-6 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "create"
                ? "text-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ➕ Add Company Route Rate
            {activeTab === "create" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("configured")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "configured"
                ? "text-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Configured Routes ({routes.length})
            {activeTab === "configured" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Main Content Layout */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium animate-pulse">
            Loading company route rate data...
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-rose-300 text-xs font-medium">
            ⚠ {error}
          </div>
        ) : (
          <div>
            {/* ============================================================
                TAB 1: ADD COMPANY ROUTE RATE FORM
                ============================================================ */}
            {activeTab === "create" && (
              <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                  <span>➕</span> Add Company Route Rate
                </h2>

                {formError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium mb-4">
                    ⚠ {formError}
                  </div>
                )}

                <form onSubmit={handleCreateRoute} className="flex flex-col gap-4">
                  {/* Company Side Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Company Side (Required)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["FROM", "TO"] as const).map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => {
                            setCompanySide(side);
                            setFormError("");
                          }}
                          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            companySide === side
                              ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/30"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{side}</span>
                          <span className="text-[10px] opacity-80">
                            {side === "FROM" ? "(Sender Side)" : "(Receiver Side)"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {companySide === "FROM"
                        ? `Company '${company?.companyName || pkg?.companyName}' is on the FROM side. From Branch is set to registered branch '${fromBranch?.branchName || "N/A"}'.`
                        : `Company '${company?.companyName || pkg?.companyName}' is on the TO side. To Branch is set to registered branch '${fromBranch?.branchName || "N/A"}'.`}
                    </p>
                  </div>

                  {/* Branch Inputs based on Company Side */}
                  {companySide === "FROM" ? (
                    <>
                      {/* Read-only From Branch */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          From Branch (Registered Branch - Read-Only)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "N/A"}
                          className="w-full text-xs rounded-xl px-4 py-2.5 outline-none border border-slate-800 bg-slate-950/70 text-amber-400 font-bold cursor-not-allowed"
                        />
                      </div>

                      {/* Selectable To Branch */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          To Branch (Required)
                        </label>
                        <select
                          value={selectedToBranchId}
                          onChange={(e) => setSelectedToBranchId(e.target.value)}
                          className="w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-amber-500 bg-slate-950 text-slate-200 cursor-pointer"
                        >
                          <option value="">-- Select To Branch --</option>
                          {branches
                            .filter((b) => b.branchId !== fromBranch?.branchId)
                            .map((b) => (
                              <option key={b.branchId} value={b.branchId}>
                                {b.branchName} ({b.branchCode})
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Selectable From Branch */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          From Branch (Required)
                        </label>
                        <select
                          value={selectedFromBranchId}
                          onChange={(e) => setSelectedFromBranchId(e.target.value)}
                          className="w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-amber-500 bg-slate-950 text-slate-200 cursor-pointer"
                        >
                          <option value="">-- Select From Branch --</option>
                          {branches
                            .filter((b) => b.branchId !== fromBranch?.branchId)
                            .map((b) => (
                              <option key={b.branchId} value={b.branchId}>
                                {b.branchName} ({b.branchCode})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Read-only To Branch */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          To Branch (Registered Branch - Read-Only)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={fromBranch ? `${fromBranch.branchName} (${fromBranch.branchCode})` : "N/A"}
                          className="w-full text-xs rounded-xl px-4 py-2.5 outline-none border border-slate-800 bg-slate-950/70 text-amber-400 font-bold cursor-not-allowed"
                        />
                      </div>
                    </>
                  )}

                  {/* Transport Rate */}
                  <Input
                    label="Transport Rate (₹) (Required)"
                    placeholder="e.g. 2500"
                    type="number"
                    value={transportRateInput}
                    onChange={(e) => setTransportRateInput(e.target.value)}
                  />

                  {/* Pickup Charge */}
                  <Input
                    label="Pickup Charge (₹)"
                    placeholder="e.g. 50"
                    type="number"
                    value={pickupChargeInput}
                    onChange={(e) => setPickupChargeInput(e.target.value)}
                  />

                  {/* Delivery Charge */}
                  <Input
                    label="Delivery Charge (₹)"
                    placeholder="e.g. 30"
                    type="number"
                    value={deliveryChargeInput}
                    onChange={(e) => setDeliveryChargeInput(e.target.value)}
                  />

                  {/* Status Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </label>
                    <div className="flex gap-3">
                      {(["Active", "Inactive"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            status === s
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

                  <Button variant="primary" size="md" loading={submitting} type="submit" className="mt-2">
                    Create Company Route
                  </Button>
                </form>
              </div>
            )}

            {/* ============================================================
                TAB 2: CONFIGURED ROUTES TABLE & FILTERS & PAGINATION
                ============================================================ */}
            {activeTab === "configured" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                    Configured Routes ({totalRecords} {totalRecords !== routes.length ? `matched / ${routes.length} total` : ""})
                  </h2>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Search by Rate */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by rate (e.g. 2500)..."
                        value={rateSearch}
                        onChange={(e) => setRateSearch(e.target.value)}
                        className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-amber-500 bg-slate-900 text-slate-200 placeholder-slate-500"
                      />
                    </div>

                    {/* From Branch Dropdown */}
                    <select
                      value={fromBranchFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFromBranchFilter(val);
                        if (val && val === toBranchFilter) setToBranchFilter("");
                      }}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-amber-500 bg-slate-900 text-slate-200 cursor-pointer"
                    >
                      <option value="">All From Branches</option>
                      {branches
                        .filter((b) => b.branchId !== toBranchFilter)
                        .map((b) => (
                          <option key={b.branchId} value={b.branchId}>
                            From: {b.branchName}
                          </option>
                        ))}
                    </select>

                    {/* To Branch Dropdown */}
                    <select
                      value={toBranchFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setToBranchFilter(val);
                        if (val && val === fromBranchFilter) setFromBranchFilter("");
                      }}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-amber-500 bg-slate-900 text-slate-200 cursor-pointer"
                    >
                      <option value="">All To Branches</option>
                      {branches
                        .filter((b) => b.branchId !== fromBranchFilter)
                        .map((b) => (
                          <option key={b.branchId} value={b.branchId}>
                            To: {b.branchName}
                          </option>
                        ))}
                    </select>

                    {/* Status Dropdown */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-amber-500 bg-slate-900 text-slate-200 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active Status</option>
                      <option value="Inactive">Inactive Status</option>
                    </select>
                  </div>

                  {/* Reset Filters button if any filter is active */}
                  {(rateSearch || fromBranchFilter || toBranchFilter || statusFilter !== "All") && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 shrink-0 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Empty State */}
                {filteredRoutes.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">🔍</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      No Routes Found
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {routes.length === 0
                        ? "No company route rates configured for this package yet. Use the 'Add Company Route Rate' tab to add one."
                        : "No company routes match your selected filter criteria."}
                    </p>
                    {(rateSearch || fromBranchFilter || toBranchFilter || statusFilter !== "All") && (
                      <Button variant="secondary" size="sm" className="mt-4" onClick={handleResetFilters}>
                        Reset Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                            <th className="py-3 px-3">S.No</th>
                            <th className="py-3 px-3">Company</th>
                            <th className="py-3 px-3">Side</th>
                            <th className="py-3 px-3">From Branch</th>
                            <th className="py-3 px-3">To Branch</th>
                            <th className="py-3 px-3">Transport</th>
                            <th className="py-3 px-3">Pickup</th>
                            <th className="py-3 px-3">Delivery</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {paginatedRoutes.map((r, i) => (
                            <tr key={r.companyRouteRateId} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {startIdx + i + 1}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-300">{r.companyName}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase bg-violet-950/60 border border-violet-500/30 text-violet-300">
                                  {r.companySide || "FROM"}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-200">{r.fromBranchName}</td>
                              <td className="py-3 px-3 font-bold text-slate-200">{r.toBranchName}</td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{r.transportRate}</td>
                              <td className="py-3 px-3 font-mono text-slate-300">₹{r.pickupCharge}</td>
                              <td className="py-3 px-3 font-mono text-slate-300">₹{r.deliveryCharge}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                                    r.status === "Active"
                                      ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                                      : "bg-rose-950/60 border-rose-500/30 text-rose-400"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
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
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-950/40 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer"
                                    title="Edit Company Route Rate"
                                  >
                                    ✏
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteRoute(r)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                                    title="Delete Company Route Rate"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Reusable Pagination Component for Company Routes */}
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
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={!!editRoute}
          onClose={() => setEditRoute(null)}
          title="Edit Company Route Rate"
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditRoute(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={submitting} onClick={handleUpdateRoute}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-slate-300">
              <p>
                <strong className="text-slate-400">Company:</strong>{" "}
                <span className="text-slate-100 font-bold">{editRoute?.companyName}</span>
              </p>
              <p>
                <strong className="text-slate-400">Package:</strong>{" "}
                <span className="text-slate-100 font-bold">{editRoute?.packageName}</span>
              </p>
            </div>

            {/* Company Side in Edit Modal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Company Side (Required)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["FROM", "TO"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setEditCompanySide(side)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      editCompanySide === side
                        ? "bg-amber-600 border-amber-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            {/* From Branch Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                From Branch
              </label>
              <select
                value={editFromBranchId}
                onChange={(e) => setEditFromBranchId(e.target.value)}
                className="w-full text-xs rounded-xl px-4 py-2.5 outline-none border border-slate-800 focus:border-amber-500 bg-slate-950 text-slate-200 cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>

            {/* To Branch Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                To Branch
              </label>
              <select
                value={editToBranchId}
                onChange={(e) => setEditToBranchId(e.target.value)}
                className="w-full text-xs rounded-xl px-4 py-2.5 outline-none border border-slate-800 focus:border-amber-500 bg-slate-950 text-slate-200 cursor-pointer"
              >
                {branches
                  .filter((b) => b.branchId !== editFromBranchId)
                  .map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName} ({b.branchCode})
                    </option>
                  ))}
              </select>
            </div>

            <Input
              label="Transport Rate (₹)"
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <div className="flex gap-3">
                {(["Active", "Inactive"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStatus(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editStatus === s
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
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteRoute}
          onClose={() => setDeleteRoute(null)}
          title="Delete Company Route Rate"
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDeleteRoute(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={submitting} onClick={handleDeleteRoute}>
                Delete Route
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-slate-300 text-xs">
            <p>
              Are you sure you want to delete the company route rate for{" "}
              <strong className="text-slate-100 font-bold">
                {deleteRoute?.companyName} ({deleteRoute?.fromBranchName} → {deleteRoute?.toBranchName})
              </strong>
              ?
            </p>
            <p className="text-[11px] text-rose-450 font-medium">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
