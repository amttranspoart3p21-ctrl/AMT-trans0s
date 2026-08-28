"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type {
  ShipmentRecord,
  ShipmentFilters as IFilters,
  WorkspaceAction,
  DashboardCard,
  WorkspaceContext,
} from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";

import { EDITABLE_COLUMNS } from "../constants/shipmentWorkspace.constants";
import { calculateQuantity } from "../utils/calculateQuantity";
import { performCompanyRouteRateLookupAndLog } from "../utils/companyRouteRateLookup";
import { buildPackageOptions } from "../utils/packageOptions";
import { calculatePricingLocally } from "../utils/calculatePricingLocally";
import { getEmptyStateMessage } from "../utils/emptyStateMessage";
import { useSpreadsheetEditing } from "../hooks/useSpreadsheetEditing";
import { useMasterData } from "../hooks/useMasterData";
import { useShipmentQueryState } from "../hooks/useShipmentQueryState";
import { useShipmentModals } from "../hooks/useShipmentModals";
import { useWorkspaceToast } from "../hooks/useWorkspaceToast";
import { useDashboardKPIs } from "../hooks/useDashboardKPIs";

export { EDITABLE_COLUMNS };

import ShipmentTable from "./ShipmentTable";
import ShipmentFilters from "./ShipmentFilters";
import Pagination from "./Pagination";
import ShipmentToolbar from "./ShipmentToolbar";
import WorkspaceDashboard from "./WorkspaceDashboard";
import ShipmentWorkspaceHeader from "./ShipmentWorkspaceHeader";
import WorkspaceLoading from "./WorkspaceLoading";
import WorkspaceError from "./WorkspaceError";
import WorkspaceToast from "./WorkspaceToast";
import WorkspaceModals from "./WorkspaceModals";

interface ShipmentWorkspaceProps {
  title?: string;
  context: WorkspaceContext;
  dashboardConfig?: { cards: DashboardCard[] };
  actions?: WorkspaceAction[];
  defaultFilters?: Partial<IFilters>;
  hideHeader?: boolean;
}



export default function ShipmentWorkspace({
  title,
  context,
  dashboardConfig = { cards: [] },
  actions = ["spreadsheet", "export"],
  defaultFilters = {},
  hideHeader = false,
}: ShipmentWorkspaceProps) {
  // Toast Notification Subsystem
  const { toastMessage, triggerToast } = useWorkspaceToast();

  // Data States
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Master data & Context resolution subsystem
  const {
    branches,
    companies,
    packages,
    companyRouteRates,
    globalRouteRates,
    availableYears,
    shipmentPackages,
    resolvedBaseName,
    fetchYears,
    fetchShipmentPackages,
  } = useMasterData({
    context,
    onContextResolved: (filterUpdate) => {
      setFilters((prev) => ({ ...prev, ...filterUpdate }));
    },
  });

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Spreadsheet editing subsystem
  const {
    mode,
    setMode,
    editedRows,
    setEditedRows,
    manualOverrides,
    highlightedCells,
    saving,
    canUndo,
    canRedo,
    hasChanges,
    modifiedCount,
    handleCellChange,
    handleBatchCellChanges,
    handleUndo,
    handleRedo,
    handleDiscardChanges,
    handleSaveAllChanges,
  } = useSpreadsheetEditing({
    shipments,
    setShipments,
    masterData: {
      branches,
      companies,
      packages,
      companyRouteRates,
      globalRouteRates,
    },
    onRefreshData: async () => {
      await fetchShipments();
      await fetchDashboardKPIs();
    },
    onToast: (msg: string) => triggerToast(msg),
  });

  // Synchronize ref to editedRows to decouple fetchShipments from keystroke state updates
  const editedRowsRef = useRef(editedRows);
  useEffect(() => {
    editedRowsRef.current = editedRows;
  }, [editedRows]);

  // Query state (filters, search, pagination, sorting)
  const {
    filters,
    setFilters,
    searchText,
    setSearchText,
    showFilters,
    setShowFilters,
    activeFilterCount,
    handleFilterChange,
    handleResetFilters,
    sortBy,
    sortOrder,
    handleSort,
    page,
    setPage,
    limit,
    totalPages,
    setTotalPages,
    totalRecords,
    setTotalRecords,
    handleLimitChange,
  } = useShipmentQueryState({
    defaultFilters,
    context,
    resolvedBaseName,
  });

  // Dashboard KPI Subsystem
  const {
    dashboardShipments,
    dashboardLoading,
    fetchDashboardKPIs,
  } = useDashboardKPIs({
    context,
    resolvedBaseName,
    filters,
  });

  // Modals & Single Shipment CRUD subsystem
  const {
    modalShipment,
    modalMode,
    isModalOpen,
    setIsModalOpen,
    handlePreviewShipment,
    handleEditShipment,
    handleModalSave,
    deleteShipmentId,
    setDeleteShipmentId,
    isDeleting,
    handleDeleteConfirm,
    activeImageDetails,
    setActiveImageDetails,
  } = useShipmentModals({
    shipments,
    page,
    setPage,
    editedRows,
    setEditedRows,
    setSelectedIds,
    onRefreshShipments: async () => {
      await fetchShipments();
    },
    onRefreshDashboard: async () => {
      await fetchDashboardKPIs();
    },
    onToast: (msg: string) => triggerToast(msg),
  });




  // Main fetch function
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      fetchYears();
      fetchShipmentPackages(filters);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      // Append filters
      if (filters.search) params.append("search", filters.search);
      if (filters.date) params.append("date", filters.date);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.fromBranch) params.append("fromBranch", filters.fromBranch);
      if (filters.toBranch) params.append("toBranch", filters.toBranch);
      if (filters.deliveryStatus) params.append("deliveryStatus", filters.deliveryStatus);
      if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
      if (filters.vehicleNumber) params.append("vehicleNumber", filters.vehicleNumber);
      if (filters.fromCompany) params.append("fromCompany", filters.fromCompany);
      if (filters.toCompany) params.append("toCompany", filters.toCompany);
      if (filters.company) params.append("company", filters.company);
      if (filters.packageType) params.append("packageType", filters.packageType);
      if (filters.pickupService) params.append("pickupService", filters.pickupService);
      if (filters.deliveryService) params.append("deliveryService", filters.deliveryService);
      if (filters.ourInvoiceNumber) params.append("ourInvoiceNumber", filters.ourInvoiceNumber);
      if (filters.customerInvoiceNumber) params.append("customerInvoiceNumber", filters.customerInvoiceNumber);
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);

      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load shipments database.");
      const json = await res.json();

      if (json.success) {
        const fetchedData: ShipmentRecord[] = json.data || [];
        const mergedData = fetchedData.map((fetched) => {
          const editState = editedRowsRef.current[fetched.shipmentId];
          return editState ? { ...editState.current } : fetched;
        });

        setShipments(mergedData);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalRecords(json.pagination.total || 0);
        } else {
          setTotalPages(1);
          setTotalRecords(json.data ? json.data.length : 0);
        }
      } else {
        throw new Error(json.message || "Unknown error occurred.");
      }
    } catch (err: any) {
      console.error("Error loading shipments:", err);
      setErrorMsg(err.message || "Failed to retrieve shipment records.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, sortBy, sortOrder, fetchYears, fetchShipmentPackages]);

  // Load shipments on page, filters, or sorting change
  useEffect(() => {
    if (context.type !== "global" && !resolvedBaseName) return;
    fetchShipments();
  }, [page, limit, filters, sortBy, sortOrder, resolvedBaseName, fetchShipments]);

  // Check if context lookup is resolved
  const isContextLoading = context.type !== "global" && !resolvedBaseName;

  const emptyStateMsg = getEmptyStateMessage(filters);

  const packageOptions = buildPackageOptions(packages, companies, branches, shipmentPackages);

  return (
    <div className="flex-1 flex flex-col p-5 w-full mx-auto relative select-none h-full min-h-0 overflow-hidden">
      {/* Header Panel */}
      <ShipmentWorkspaceHeader
        title={title}
        context={context}
        resolvedBaseName={resolvedBaseName}
        hideHeader={hideHeader}
      />

      {isContextLoading ? (
        <WorkspaceLoading />
      ) : (
        <>
          {/* Workspace KPIs Dashboard */}
          {context.type !== "global" && (
            <div className="mt-4 mb-2.5">
              {dashboardLoading ? (
                <div className="h-[96px] bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500 font-medium">
                  Evaluating KPI metrics...
                </div>
              ) : (
                <WorkspaceDashboard
                  shipments={dashboardShipments}
                  context={{ ...context, displayName: resolvedBaseName }}
                  cards={dashboardConfig.cards}
                />
              )}
            </div>
          )}

          {/* Controller & Unified Action Toolbar */}
          <div className={`shrink-0 ${hideHeader && context.type === "global" ? "mb-2.5" : "mt-3 mb-2.5"}`}>
            <ShipmentToolbar
              mode={mode}
              setMode={setMode}
              onSaveAll={handleSaveAllChanges}
              onDiscard={handleDiscardChanges}
              hasChanges={hasChanges}
              modifiedCount={modifiedCount}
              saving={saving}
              actions={actions}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              searchText={searchText}
              setSearchText={setSearchText}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              activeFilterCount={Object.values(filters).filter(Boolean).length}
            />
          </div>

          {/* Advanced Filter Component */}
          <div className="mb-2.5 shrink-0">
            <ShipmentFilters
              filters={filters}
              onChange={handleFilterChange}
              branches={branches}
              onReset={handleResetFilters}
              visible={showFilters}
              availableYears={availableYears}
              packageOptions={packageOptions}
              onClose={() => setShowFilters(false)}
            />
          </div>

          {/* Error Alert Display */}
          {errorMsg && (
            <WorkspaceError errorMsg={errorMsg} onRetry={fetchShipments} />
          )}

          {/* Shipment Records Table Component */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ShipmentTable
              shipments={shipments}
              loading={loading}
              onDelete={setDeleteShipmentId}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              mode={mode}
              onChangeRow={handleCellChange}
              onBatchChangeRow={handleBatchCellChanges}
              branches={branches}
              onViewImage={(imageId, fileName) => setActiveImageDetails({ imageId, fileName })}
              selectedIds={selectedIds}
              onSelectRow={setSelectedIds}
              onSelectAll={setSelectedIds}
              dirtyRows={editedRows}
              companies={companies}
              packages={packages}
              companyRouteRates={companyRouteRates}
              globalRouteRates={globalRouteRates}
              highlightedCells={highlightedCells}
              emptyStateMessage={emptyStateMsg}
              onPreviewShipment={handlePreviewShipment}
              onEditShipment={handleEditShipment}
            />
          </div>

          {/* Pagination Component */}
          {!loading && shipments.length > 0 && (
            <div className="mt-2.5 shrink-0">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={handleLimitChange}
                totalRecords={totalRecords}
              />
            </div>
          )}

          {/* Dynamic Modals Group */}
          <WorkspaceModals
            isShipmentModalOpen={isModalOpen}
            onCloseShipmentModal={() => setIsModalOpen(false)}
            modalShipment={modalShipment}
            modalMode={modalMode}
            branches={branches}
            companies={companies}
            packages={packages}
            companyRouteRates={companyRouteRates}
            globalRouteRates={globalRouteRates}
            onSaveShipmentModal={handleModalSave}
            calculatePricingLocally={(rec) =>
              calculatePricingLocally(rec, {
                branches,
                companies,
                packages,
                companyRouteRates,
                globalRouteRates,
              })
            }
            deleteShipmentId={deleteShipmentId}
            onCancelDelete={() => setDeleteShipmentId(null)}
            onConfirmDelete={handleDeleteConfirm}
            isDeleting={isDeleting}
            activeImageDetails={activeImageDetails}
            onCloseImageViewer={() => setActiveImageDetails(null)}
          />

          {/* Toast Notification Popup */}
          <WorkspaceToast message={toastMessage} />
        </>
      )}
    </div>
  );
}
