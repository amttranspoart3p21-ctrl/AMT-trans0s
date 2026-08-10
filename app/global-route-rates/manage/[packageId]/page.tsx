"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/app/shipments/components/Pagination";
import type { Package } from "@/types/packageType";
import type { Branch } from "@/types/branch";
import type { GlobalRouteRate } from "@/types/global-route-rate";

interface PageProps {
  params: Promise<{ packageId: string }>;
}

type ManageTab = "create" | "configured";

export default function ManageGlobalRouteRatesPage({ params }: PageProps) {
  const { packageId } = use(params);

  const [activeTab, setActiveTab] = useState<ManageTab>("create");

  const [pkg, setPkg] = useState<Package | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [routes, setRoutes] = useState<GlobalRouteRate[]>([]);
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
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal state
  const [editRoute, setEditRoute] = useState<GlobalRouteRate | null>(null);
  const [editRateInput, setEditRateInput] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");
  const [deleteRoute, setDeleteRoute] = useState<GlobalRouteRate | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ============================================================
     API Calls
     ============================================================ */

  // Load Package Details, Branches, and Configured Routes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pkgRes, bRes, rRes] = await Promise.all([
        fetch(`/api/packages/${packageId}`),
        fetch("/api/branches?limit=100"),
        fetch(`/api/global-route-rates?packageId=${packageId}`),
      ]);

      const pkgJson = await pkgRes.json();
      const bJson = await bRes.json();
      const rJson = await rRes.json();

      if (!pkgRes.ok) throw new Error(pkgJson.message || "Failed to load package.");
      setPkg(pkgJson);

      if (bJson.success && Array.isArray(bJson.data)) {
        setBranches(bJson.data);
      }

      if (rJson.routeRates && Array.isArray(rJson.routeRates)) {
        setRoutes(rJson.routeRates);
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

  // Create Global Route Rate: POST /api/global-route-rates
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fromBranchId) {
      setFormError("Please select From Branch.");
      return;
    }
    if (!toBranchId) {
      setFormError("Please select To Branch.");
      return;
    }
    if (fromBranchId === toBranchId) {
      setFormError("From Branch and To Branch cannot be the same.");
      return;
    }
    const numRate = Number(rateInput);
    if (isNaN(numRate) || numRate <= 0) {
      setFormError("Please enter a valid rate amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/global-route-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId,
          toBranchId,
          packageId,
          rate: numRate,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create route rate.");

      showToast("Global route rate created successfully!");
      setFromBranchId("");
      setToBranchId("");
      setRateInput("");
      setStatus("Active");
      await loadData();
      setActiveTab("configured"); // Automatically switch to configured routes tab!
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create route rate.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Global Route Rate: PUT /api/global-route-rates/[routeRateId]
  const handleUpdateRoute = async () => {
    if (!editRoute) return;
    const numRate = Number(editRateInput);
    if (isNaN(numRate) || numRate <= 0) {
      showToast("Please enter a valid rate amount.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/global-route-rates/${editRoute.routeRateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromBranchId: editRoute.fromBranchId,
          toBranchId: editRoute.toBranchId,
          packageId: editRoute.packageId,
          rate: numRate,
          status: editStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update route rate.");

      showToast("Global route rate updated successfully!");
      setEditRoute(null);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update route rate.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Global Route Rate: DELETE /api/global-route-rates/[routeRateId]
  const handleDeleteRoute = async () => {
    if (!deleteRoute) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/global-route-rates/${deleteRoute.routeRateId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete route rate.");

      showToast("Route rate deleted successfully!");
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
    // 1. Search by Rate
    if (rateSearch.trim()) {
      const query = rateSearch.trim();
      if (!String(r.rate).includes(query)) return false;
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

        {/* Navigation Back Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/global-route-rates"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-violet-400 transition-colors"
          >
            ← Back to Route Rates
          </Link>
        </div>

        {/* Read-only Context Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-violet-400 text-xs">
                🌐
              </span>
              <h1 className="text-lg font-black uppercase tracking-wider text-slate-100">
                {pkg ? pkg.packageName : "Loading Package..."}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/60 border border-violet-500/30 text-violet-400">
                GLOBAL PACKAGE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Package ID: <span className="text-slate-200 font-bold">{packageId}</span>
              {pkg?.description && <span className="text-slate-500 ml-3">| {pkg.description}</span>}
            </p>
          </div>
        </div>

        {/* Tabs Header */}
        <div className="flex border-b border-slate-800 mb-6 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "create"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ➕ Add Global Route Rate
            {activeTab === "create" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("configured")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === "configured"
                ? "text-violet-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Configured Routes ({routes.length})
            {activeTab === "configured" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Main Content Layout */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium animate-pulse">
            Loading route rate data...
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-rose-300 text-xs font-medium">
            ⚠ {error}
          </div>
        ) : (
          <div>
            {/* ============================================================
                TAB 1: ADD GLOBAL ROUTE RATE FORM
                ============================================================ */}
            {activeTab === "create" && (
              <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                  <span>➕</span> Add Global Route Rate
                </h2>

                {formError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs font-medium mb-4">
                    ⚠ {formError}
                  </div>
                )}

                <form onSubmit={handleCreateRoute} className="flex flex-col gap-4">
                  {/* From Branch */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      From Branch (Required)
                    </label>
                    <select
                      value={fromBranchId}
                      onChange={(e) => {
                        setFromBranchId(e.target.value);
                        if (e.target.value === toBranchId) setToBranchId("");
                      }}
                      className="w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 cursor-pointer"
                    >
                      <option value="">-- Select From Branch --</option>
                      {branches.map((b) => (
                        <option key={b.branchId} value={b.branchId}>
                          {b.branchName} ({b.branchCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Branch */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      To Branch (Required)
                    </label>
                    <select
                      value={toBranchId}
                      onChange={(e) => setToBranchId(e.target.value)}
                      className="w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border border-slate-800 focus:border-violet-500 bg-slate-950 text-slate-200 cursor-pointer"
                    >
                      <option value="">-- Select To Branch --</option>
                      {branches
                        .filter((b) => b.branchId !== fromBranchId)
                        .map((b) => (
                          <option key={b.branchId} value={b.branchId}>
                            {b.branchName} ({b.branchCode})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Rate Input */}
                  <Input
                    label="Rate (₹) (Required)"
                    placeholder="e.g. 1050"
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
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
                    Create Route Rate
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
                        placeholder="Search by rate (e.g. 1050)..."
                        value={rateSearch}
                        onChange={(e) => setRateSearch(e.target.value)}
                        className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-violet-500 bg-slate-900 text-slate-200 placeholder-slate-500"
                      />
                    </div>

                    {/* From Branch Dropdown */}
                    <select
                      value={fromBranchFilter}
                      onChange={(e) => setFromBranchFilter(e.target.value)}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-violet-500 bg-slate-900 text-slate-200 cursor-pointer"
                    >
                      <option value="">All From Branches</option>
                      {branches.map((b) => (
                        <option key={b.branchId} value={b.branchId}>
                          From: {b.branchName}
                        </option>
                      ))}
                    </select>

                    {/* To Branch Dropdown */}
                    <select
                      value={toBranchFilter}
                      onChange={(e) => setToBranchFilter(e.target.value)}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-violet-500 bg-slate-900 text-slate-200 cursor-pointer"
                    >
                      <option value="">All To Branches</option>
                      {branches.map((b) => (
                        <option key={b.branchId} value={b.branchId}>
                          To: {b.branchName}
                        </option>
                      ))}
                    </select>

                    {/* Status Dropdown */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none border border-slate-800 focus:border-violet-500 bg-slate-900 text-slate-200 cursor-pointer"
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
                      className="text-xs text-violet-400 hover:text-violet-300 font-bold px-3 py-2 rounded-xl bg-violet-950/40 border border-violet-500/30 shrink-0 cursor-pointer"
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
                        ? "No routes configured for this package yet. Use the 'Add Global Route Rate' tab to add one."
                        : "No routes match your selected filter criteria."}
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
                            <th className="py-3 px-3">From Branch</th>
                            <th className="py-3 px-3">To Branch</th>
                            <th className="py-3 px-3">Rate</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {paginatedRoutes.map((r, i) => (
                            <tr key={r.routeRateId} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {startIdx + i + 1}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-200">{r.fromBranchName}</td>
                              <td className="py-3 px-3 font-bold text-slate-200">{r.toBranchName}</td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{r.rate}</td>
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
                                      setEditRateInput(String(r.rate));
                                      setEditStatus(r.status);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-950/40 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer"
                                    title="Edit Rate"
                                  >
                                    ✏
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteRoute(r)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                                    title="Delete Route Rate"
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

                    {/* Reusable Pagination Component for Routes */}
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
          title="Edit Global Route Rate"
          size="sm"
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
                <strong className="text-slate-400">Route:</strong>{" "}
                <span className="text-slate-100 font-bold">
                  {editRoute?.fromBranchName} → {editRoute?.toBranchName}
                </span>
              </p>
              <p>
                <strong className="text-slate-400">Package:</strong>{" "}
                <span className="text-slate-100 font-bold">{editRoute?.packageName}</span>
              </p>
            </div>

            <Input
              label="Rate (₹)"
              type="number"
              value={editRateInput}
              onChange={(e) => setEditRateInput(e.target.value)}
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
          title="Delete Global Route Rate"
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
              Are you sure you want to delete the route rate for{" "}
              <strong className="text-slate-100 font-bold">
                {deleteRoute?.fromBranchName} → {deleteRoute?.toBranchName}
              </strong>
              ?
            </p>
            <p className="text-[11px] text-rose-450 font-medium">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
