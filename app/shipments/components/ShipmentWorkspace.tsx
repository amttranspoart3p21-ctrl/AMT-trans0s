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
import { getFilteredPackageOptions, isGlobalRoutePackage } from "@/utils/package-filter";
import { resolveCompanyDetails } from "@/utils/shipment-shared";

// Import custom sub-components
export const EDITABLE_COLUMNS: Array<keyof ShipmentRecord> = [
  "date",
  "vehicleNumber",
  "fromAmtBranch",
  "fromCompany",
  "toAmtBranch",
  "toCompany",
  "packageType",
  "quantity",
  "transportRate",
  "pricePerPiece",
  "pickupService",
  "pickupCharge",
  "deliveryService",
  "deliveryCharge",
  "totalAmount",
  "paymentReceivingBranch",
  "paymentCompany",
  "paymentStatus",
  "deliveryStatus",
  "ourInvoiceNumber",
  "customerInvoiceNumber"
];

import ShipmentTable from "./ShipmentTable";
import ShipmentFilters from "./ShipmentFilters";
import Pagination from "./Pagination";
import ShipmentModal from "./ShipmentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ImageViewerModal from "./ImageViewerModal";
import ShipmentToolbar from "./ShipmentToolbar";
import WorkspaceDashboard from "./WorkspaceDashboard";

interface ShipmentWorkspaceProps {
  title: string;
  context: WorkspaceContext;
  dashboardConfig?: { cards: DashboardCard[] };
  actions?: WorkspaceAction[];
  defaultFilters?: Partial<IFilters>;
}

const calculateQuantity = (qty: string | null | undefined): number => {
  if (qty === null || qty === undefined) return 1;
  const clean = qty.trim();
  if (clean === "") return 1;
  const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
  if (!pattern.test(clean)) return 1;
  const parts = clean.split(/[xX*×]/);
  let product = 1;
  for (const part of parts) {
    const valStr = part.trim();
    if (!/^\d+$/.test(valStr)) return 1;
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val <= 0) return 1;
    product *= val;
  }
  return product;
};

export default function ShipmentWorkspace({
  title,
  context,
  dashboardConfig = { cards: [] },
  actions = ["spreadsheet", "export"],
  defaultFilters = {},
}: ShipmentWorkspaceProps) {
  // Data States
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [dashboardShipments, setDashboardShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active master lists
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [companyRouteRates, setCompanyRouteRates] = useState<CompanyRouteRate[]>([]);
  const [globalRouteRates, setGlobalRouteRates] = useState<GlobalRouteRate[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Base resolved name for context dashboards (e.g. branch name or company name)
  const [resolvedBaseName, setResolvedBaseName] = useState<string>("");

  // Track if we have already initialized filters to avoid overwriting user updates later
  const hasInitializedFilters = useRef<boolean>(false);

  // Spreadsheet Mode state
  const [mode, setMode] = useState<"read-only" | "spreadsheet">("read-only");

  // Selection & Dirty States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editedRows, setEditedRows] = useState<Record<string, { original: ShipmentRecord; current: ShipmentRecord }>>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Auto Fill & Manual Override tracking states
  const [manualOverrides, setManualOverrides] = useState<Record<string, Set<string>>>({});
  const [highlightedCells, setHighlightedCells] = useState<Record<string, Set<string>>>({});

  // Undo / Redo history stacks
  interface EditSnapshot {
    shipments: ShipmentRecord[];
    editedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>;
    manualOverrides: Record<string, Set<string>>;
  }
  const [undoStack, setUndoStack] = useState<EditSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditSnapshot[]>([]);

  const pushToUndo = (
    currentShipments: ShipmentRecord[],
    currentEditedRows: Record<string, { original: ShipmentRecord; current: ShipmentRecord }>,
    currentOverrides: Record<string, Set<string>>
  ) => {
    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(currentOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });

    setUndoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(currentShipments)),
        editedRows: JSON.parse(JSON.stringify(currentEditedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(manualOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });
    setRedoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(shipments)),
        editedRows: JSON.parse(JSON.stringify(editedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);

    setShipments(previous.shipments);
    setEditedRows(previous.editedRows);
    setManualOverrides(previous.manualOverrides);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    const clonedOverrides: Record<string, Set<string>> = {};
    Object.entries(manualOverrides).forEach(([id, s]) => {
      clonedOverrides[id] = new Set(s);
    });
    setUndoStack((prev) => [
      ...prev,
      {
        shipments: JSON.parse(JSON.stringify(shipments)),
        editedRows: JSON.parse(JSON.stringify(editedRows)),
        manualOverrides: clonedOverrides,
      },
    ]);

    setShipments(next.shipments);
    setEditedRows(next.editedRows);
    setManualOverrides(next.manualOverrides);
  };

  // Search & Filter UI toggle
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Search Input State (with local search debounce)
  const [searchText, setSearchText] = useState<string>("");

  // Filters State
  const [filters, setFilters] = useState<IFilters>({
    search: undefined,
    date: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    fromBranch: undefined,
    toBranch: undefined,
    deliveryStatus: undefined,
    paymentStatus: undefined,
    vehicleNumber: undefined,
    fromCompany: undefined,
    toCompany: undefined,
    company: undefined,
    packageType: undefined,
    pickupService: undefined,
    deliveryService: undefined,
    ourInvoiceNumber: undefined,
    customerInvoiceNumber: undefined,
    ...defaultFilters,
  });

  // Sorting States
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination States
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Single Shipment Preview / Edit modal states
  const [modalShipment, setModalShipment] = useState<ShipmentRecord | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "edit">("preview");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Modal States
  const [deleteShipmentId, setDeleteShipmentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [activeImageDetails, setActiveImageDetails] = useState<{ imageId: string; fileName: string } | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shipmentPackages, setShipmentPackages] = useState<string[]>([]);

  // Fetch branches and all active master data objects on mount (runs locally)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [branchRes, compRes, pkgRes, crrRes, grrRes, yearRes] = await Promise.all([
          fetch("/api/branches?status=Active"),
          fetch("/api/companies?status=Active"),
          fetch("/api/packages?status=Active"),
          fetch("/api/company-route-rates?status=Active"),
          fetch("/api/global-route-rates?status=Active"),
          fetch("/api/shipments/years"),
        ]);

        if (branchRes.ok) {
          const json = await branchRes.json();
          if (json.success && Array.isArray(json.data)) setBranches(json.data);
        }
        if (compRes.ok) {
          const json = await compRes.json();
          if (json.companies) setCompanies(json.companies);
        }
        if (pkgRes.ok) {
          const json = await pkgRes.json();
          if (json.packages) setPackages(json.packages);
        }
        if (crrRes.ok) {
          const json = await crrRes.json();
          if (json.companyRouteRates) setCompanyRouteRates(json.companyRouteRates);
        }
        if (grrRes.ok) {
          const json = await grrRes.json();
          if (json.routeRates) setGlobalRouteRates(json.routeRates);
        }
        if (yearRes.ok) {
          const json = await yearRes.json();
          if (json.success && Array.isArray(json.years)) setAvailableYears(json.years);
        }
      } catch (err) {
        console.error("Error loading master database:", err);
      }
    };
    fetchMasterData();
  }, []);

  // Resolve base filter name from dynamic workspaceId only ONCE on first load
  useEffect(() => {
    if (context.type === "global") {
      setResolvedBaseName("");
      return;
    }
    if (hasInitializedFilters.current) return;

    if (context.type === "branch" && branches.length > 0 && context.id) {
      const b = branches.find((item) => item.branchId === context.id);
      if (b) {
        setResolvedBaseName(b.branchName);
        setFilters((prev) => ({ ...prev, fromBranch: b.branchName }));
        hasInitializedFilters.current = true;
      }
    }
    if (context.type === "company" && companies.length > 0 && context.id) {
      const c = companies.find((item) => item.companyId === context.id);
      if (c) {
        setResolvedBaseName(c.companyName);
        setFilters((prev) => ({ ...prev, company: c.companyName }));
        hasInitializedFilters.current = true;
      }
    }
  }, [context, branches, companies]);

  // Debounced search text observer
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchText.trim() || undefined,
      }));
      setPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const fetchShipmentPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);
      if (filters.fromBranch) params.append("fromBranch", filters.fromBranch);
      if (filters.toBranch) params.append("toBranch", filters.toBranch);
      if (filters.company) params.append("company", filters.company);

      const res = await fetch(`/api/shipments/packages?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.packages)) {
          setShipmentPackages(json.packages);
        }
      }
    } catch (err) {
      console.error("Error loading shipment packages:", err);
    }
  };

  const fetchYears = async () => {
    try {
      const res = await fetch("/api/shipments/years");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.years)) {
          setAvailableYears(json.years);
        }
      }
    } catch (err) {
      console.error("Error loading years dynamically:", err);
    }
  };

  // Main fetch function
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      fetchYears();
      fetchShipmentPackages();
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
          const editState = editedRows[fetched.shipmentId];
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
  }, [page, limit, filters, sortBy, sortOrder, editedRows]);

  // Fetch all shipments matching base context for Dashboard KPIs
  const fetchDashboardKPIs = useCallback(async () => {
    if (context.type === "global" || !resolvedBaseName) return;
    setDashboardLoading(true);
    try {
      const params = new URLSearchParams();
      if (context.type === "branch") {
        params.append("fromBranch", resolvedBaseName);
      } else if (context.type === "company") {
        params.append("company", resolvedBaseName);
      }
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);

      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDashboardShipments(json.data);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard KPIs:", err);
    } finally {
      setDashboardLoading(false);
    }
  }, [context, resolvedBaseName, filters]);

  // Load shipments on page, filters, or sorting change
  useEffect(() => {
    if (context.type !== "global" && !resolvedBaseName) return;
    fetchShipments();
  }, [page, limit, filters, sortBy, sortOrder, resolvedBaseName]);

  // Fetch KPIs when base is resolved
  useEffect(() => {
    fetchDashboardKPIs();
  }, [resolvedBaseName, fetchDashboardKPIs]);

  // Sorting Handler
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Replicate backend pricing calculation locally in browser
  const calculatePricingLocally = (shipment: ShipmentRecord) => {
    const fromBranchKey = (shipment.fromAmtBranch || "").trim().toLowerCase();
    const toBranchKey = (shipment.toAmtBranch || "").trim().toLowerCase();
    
    // Extract base package name to match route rates correctly (ignoring suffix)
    const getBasePackageName = (val: string): string => {
      const idx = val.indexOf("(");
      if (idx !== -1) return val.substring(0, idx).trim();
      return val.trim();
    };
    const packageKey = getBasePackageName(shipment.packageType || "").trim().toLowerCase();

    const paymentCompanyVal = shipment.paymentCompany || "";
    if (!paymentCompanyVal) {
      return { transportRate: null, pickupCharge: null, deliveryCharge: null, pricePerPiece: null };
    }

    const payBranchName = shipment.paymentReceivingBranch === "From Company" ? shipment.fromAmtBranch : shipment.paymentReceivingBranch === "To Company" ? shipment.toAmtBranch : "";
    const paymentCompanyDetails = resolveCompanyDetails(paymentCompanyVal, payBranchName, companies);
    const paymentCompanyId = paymentCompanyDetails.companyId;

    const fromCompanyDetails = resolveCompanyDetails(shipment.fromCompany, shipment.fromAmtBranch, companies);
    const fromCompanyId = fromCompanyDetails.companyId;

    const toCompanyDetails = resolveCompanyDetails(shipment.toCompany, shipment.toAmtBranch, companies);
    const toCompanyId = toCompanyDetails.companyId;

    const packageObj = packages.find(
      (p) => p.packageName.trim().toLowerCase() === packageKey
    );
    const packageId = packageObj?.packageId || "";
    const packageExists = !!packageObj && packageObj.status === "Active";

    if (!packageExists) {
      return { transportRate: null, pickupCharge: null, deliveryCharge: null, pricePerPiece: null };
    }

    const fromBranchObj = branches.find(
      (b) => b.branchName?.trim().toLowerCase() === fromBranchKey
    );
    const fromBranchId = fromBranchObj?.branchId || "";

    const toBranchObj = branches.find(
      (b) => b.branchName?.trim().toLowerCase() === toBranchKey
    );
    const toBranchId = toBranchObj?.branchId || "";

    let transportRate: number | null = null;
    let pickupCharge = 0;
    let deliveryCharge = 0;
    let isGlobalPackage = false;

    // 1. Resolve Transport Rate
    const matchedCompanyRate = companyRouteRates.find(
      (c) =>
        c.status === "Active" &&
        c.companyId === paymentCompanyId &&
        (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.trim().toLowerCase() === fromBranchKey) : c.fromBranchName.trim().toLowerCase() === fromBranchKey) &&
        (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.trim().toLowerCase() === toBranchKey) : c.toBranchName.trim().toLowerCase() === toBranchKey) &&
        (packageId ? (c.packageId === packageId || c.packageName.trim().toLowerCase() === packageKey) : c.packageName.trim().toLowerCase() === packageKey)
    );

    if (matchedCompanyRate) {
      transportRate = matchedCompanyRate.transportRate;
    } else {
      const matchedGlobalRate = globalRouteRates.find(
        (g) =>
          g.status === "Active" &&
          (fromBranchId ? (g.fromBranchId === fromBranchId || g.fromBranchName.trim().toLowerCase() === fromBranchKey) : g.fromBranchName.trim().toLowerCase() === fromBranchKey) &&
          (toBranchId ? (g.toBranchId === toBranchId || g.toBranchName.trim().toLowerCase() === toBranchKey) : g.toBranchName.trim().toLowerCase() === toBranchKey) &&
          (packageId ? (g.packageId === packageId || g.packageName.trim().toLowerCase() === packageKey) : g.packageName.trim().toLowerCase() === packageKey)
      );

      if (matchedGlobalRate) {
        transportRate = matchedGlobalRate.rate;
        isGlobalPackage = true;
      }
    }

    let matchedFromCompanyRate;
    let matchedToCompanyRate;

    if (isGlobalPackage) {
      pickupCharge = 0;
      deliveryCharge = 0;
    } else {
      // 2. Resolve Pickup Charge (always belongs to Sender Company package)
      if (shipment.pickupService === "Branch" || shipment.pickupService === "Free Home") {
        pickupCharge = 0;
      } else if (shipment.pickupService === "Home") {
        matchedFromCompanyRate = companyRouteRates.find(
          (c) =>
            c.status === "Active" &&
            c.companyId === fromCompanyId &&
            (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.trim().toLowerCase() === fromBranchKey) : c.fromBranchName.trim().toLowerCase() === fromBranchKey) &&
            (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.trim().toLowerCase() === toBranchKey) : c.toBranchName.trim().toLowerCase() === toBranchKey) &&
            (packageId ? (c.packageId === packageId || c.packageName.trim().toLowerCase() === packageKey) : c.packageName.trim().toLowerCase() === packageKey)
        );
        if (
          matchedFromCompanyRate &&
          typeof matchedFromCompanyRate.pickupCharge === "number" &&
          !isNaN(matchedFromCompanyRate.pickupCharge)
        ) {
          pickupCharge = matchedFromCompanyRate.pickupCharge;
        } else {
          pickupCharge = 0;
        }
      }

      // 3. Resolve Delivery Charge (always belongs to Receiver Company package)
      if (shipment.deliveryService === "Branch" || shipment.deliveryService === "Free Home") {
        deliveryCharge = 0;
      } else if (shipment.deliveryService === "Home") {
        matchedToCompanyRate = companyRouteRates.find(
          (c) =>
            c.status === "Active" &&
            c.companyId === toCompanyId &&
            (fromBranchId ? (c.fromBranchId === fromBranchId || c.fromBranchName.trim().toLowerCase() === fromBranchKey) : c.fromBranchName.trim().toLowerCase() === fromBranchKey) &&
            (toBranchId ? (c.toBranchId === toBranchId || c.toBranchName.trim().toLowerCase() === toBranchKey) : c.toBranchName.trim().toLowerCase() === toBranchKey) &&
            (packageId ? (c.packageId === packageId || c.packageName.trim().toLowerCase() === packageKey) : c.packageName.trim().toLowerCase() === packageKey)
        );
        if (
          matchedToCompanyRate &&
          typeof matchedToCompanyRate.deliveryCharge === "number" &&
          !isNaN(matchedToCompanyRate.deliveryCharge)
        ) {
          deliveryCharge = matchedToCompanyRate.deliveryCharge;
        } else {
          deliveryCharge = 0;
        }
      }
    }

    console.log({
      pickupChargeFromDB: matchedFromCompanyRate?.pickupCharge,
      finalPickupChargeBeingSaved: pickupCharge
    });

    let pricePerPiece: number | null = null;
    if (transportRate !== null) {
      pricePerPiece = transportRate + pickupCharge + deliveryCharge;
    }

    return {
      transportRate,
      pickupCharge,
      deliveryCharge,
      pricePerPiece,
    };
  };

  // Triggers visual flash highlight
  const triggerHighlight = (shipmentId: string, fields: string[]) => {
    setHighlightedCells((prev) => {
      const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
      fields.forEach((f) => existing.add(f));
      return { ...prev, [shipmentId]: existing };
    });

    setTimeout(() => {
      setHighlightedCells((prev) => {
        const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
        fields.forEach((f) => existing.delete(f));
        const next = { ...prev };
        if (existing.size === 0) {
          delete next[shipmentId];
        } else {
          next[shipmentId] = existing;
        }
        return next;
      });
    }, 1000);
  };

  const applyRowUpdates = (
    originalShipment: ShipmentRecord,
    updatedFields: Partial<ShipmentRecord>,
    overrides: Set<string>
  ) => {
    const currentRecord = { ...originalShipment, ...updatedFields };
    const autoFills: Partial<ShipmentRecord> = {};

    // 1. paymentReceivingBranch logic
    if ("paymentReceivingBranch" in updatedFields) {
      overrides.delete("paymentCompany");
    }

    const isPaymentCompanyManual = overrides.has("paymentCompany") && !("paymentReceivingBranch" in updatedFields);
    
    if (
      "paymentReceivingBranch" in updatedFields ||
      "fromCompany" in updatedFields ||
      "toCompany" in updatedFields
    ) {
      if (!isPaymentCompanyManual) {
        if (currentRecord.paymentReceivingBranch === "From Company" && currentRecord.fromCompany) {
          const resolved = resolveCompanyDetails(currentRecord.fromCompany, currentRecord.fromAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
          currentRecord.paymentCompany = resolved.companyName;
        } else if (currentRecord.paymentReceivingBranch === "To Company" && currentRecord.toCompany) {
          const resolved = resolveCompanyDetails(currentRecord.toCompany, currentRecord.toAmtBranch, companies);
          autoFills.paymentCompany = resolved.companyName;
          currentRecord.paymentCompany = resolved.companyName;
        }
      }
    }

    // 2. branch integrity logic
    if ("fromAmtBranch" in updatedFields) {
      const value = currentRecord.fromAmtBranch;
      const branchObj = branches.find((b) => b.branchName?.trim().toLowerCase() === value?.trim().toLowerCase());
      const validFromCompanies = companies
        .filter((c) => branchObj && c.branchId === branchObj.branchId)
        .map((c) => c.companyName);
      if (currentRecord.fromCompany && !validFromCompanies.includes(currentRecord.fromCompany) && !("fromCompany" in updatedFields)) {
        autoFills.fromCompany = "";
        currentRecord.fromCompany = "";
      }
    }
    if ("toAmtBranch" in updatedFields) {
      const value = currentRecord.toAmtBranch;
      const branchObj = branches.find((b) => b.branchName?.trim().toLowerCase() === value?.trim().toLowerCase());
      const validToCompanies = companies
        .filter((c) => branchObj && c.branchId === branchObj.branchId)
        .map((c) => c.companyName);
      if (currentRecord.toCompany && !validToCompanies.includes(currentRecord.toCompany) && !("toCompany" in updatedFields)) {
        autoFills.toCompany = "";
        currentRecord.toCompany = "";
      }
    }

    // Check global package transition
    const wasGlobal = isGlobalRoutePackage(
      originalShipment.packageType,
      originalShipment.fromAmtBranch,
      originalShipment.toAmtBranch,
      originalShipment.paymentCompany,
      companyRouteRates,
      globalRouteRates,
      companies,
      branches,
      originalShipment.paymentReceivingBranch
    );

    const tempRecord = { ...currentRecord, ...autoFills };
    const isNowGlobal = isGlobalRoutePackage(
      tempRecord.packageType,
      tempRecord.fromAmtBranch,
      tempRecord.toAmtBranch,
      tempRecord.paymentCompany,
      companyRouteRates,
      globalRouteRates,
      companies,
      branches,
      tempRecord.paymentReceivingBranch
    );

    if (isNowGlobal && !wasGlobal) {
      autoFills.pickupService = "Branch";
      autoFills.deliveryService = "Branch";
      autoFills.pickupCharge = 0;
      autoFills.deliveryCharge = 0;
      currentRecord.pickupService = "Branch";
      currentRecord.deliveryService = "Branch";
      currentRecord.pickupCharge = 0;
      currentRecord.deliveryCharge = 0;
    }

    // 3. Dynamic package validation logic
    if (
      "fromAmtBranch" in updatedFields ||
      "toAmtBranch" in updatedFields ||
      "paymentCompany" in updatedFields ||
      "paymentReceivingBranch" in updatedFields ||
      ("paymentCompany" in autoFills)
    ) {
      const currentPkg = currentRecord.packageType?.trim();
      if (currentPkg && currentPkg.includes("(")) {
        // If it is a company-specific rate package, verify if it is still valid
        const validOptions = getFilteredPackageOptions(
          currentRecord.fromAmtBranch,
          currentRecord.toAmtBranch,
          currentRecord.paymentCompany,
          companyRouteRates,
          globalRouteRates,
          companies,
          branches,
          currentRecord.paymentReceivingBranch
        );
        const validValues = validOptions.map(opt => opt.value.toLowerCase().trim());
        if (!validValues.includes(currentPkg.toLowerCase()) && !("packageType" in updatedFields)) {
          autoFills.packageType = "";
          currentRecord.packageType = "";
        }
      }
    }

    // 3. pricing trigger logic
    const pricingTriggerFields = [
      "fromAmtBranch",
      "fromCompany",
      "toAmtBranch",
      "toCompany",
      "packageType",
      "paymentCompany",
      "paymentReceivingBranch",
      "pickupService",
      "deliveryService",
      "quantity",
    ];

    const hasPricingTrigger = pricingTriggerFields.some(
      (field) => field in updatedFields || field in autoFills
    );

    if (hasPricingTrigger) {
      const calc = calculatePricingLocally(currentRecord);

      const isTransportRateManual = overrides.has("transportRate") || ("transportRate" in updatedFields);
      const isPricePerPieceManual = overrides.has("pricePerPiece") || ("pricePerPiece" in updatedFields);

      if (!isTransportRateManual) {
        autoFills.transportRate = calc.transportRate;
        currentRecord.transportRate = calc.transportRate;
      }
      
      autoFills.pickupCharge = calc.pickupCharge;
      currentRecord.pickupCharge = calc.pickupCharge;
      
      autoFills.deliveryCharge = calc.deliveryCharge;
      currentRecord.deliveryCharge = calc.deliveryCharge;

      if (!isPricePerPieceManual) {
        autoFills.pricePerPiece = calc.pricePerPiece;
        currentRecord.pricePerPiece = calc.pricePerPiece;
      }
    }

    // 4. total amount logic
    if (currentRecord.pricePerPiece !== null && currentRecord.pricePerPiece !== undefined) {
      const qty = calculateQuantity(currentRecord.quantity);
      autoFills.totalAmount = qty * currentRecord.pricePerPiece;
    } else {
      autoFills.totalAmount = null;
    }
    currentRecord.totalAmount = autoFills.totalAmount;

    return {
      updatedShipment: currentRecord,
      autoFills,
    };
  };

  const handleBatchCellChanges = (rowUpdates: Record<string, Partial<ShipmentRecord>>) => {
    const dirtyIds = Object.keys(rowUpdates);
    if (dirtyIds.length === 0) return;

    pushToUndo(shipments, editedRows, manualOverrides);

    const highlightsToTrigger: Record<string, string[]> = {};
    const nextManualOverridesMap: Record<string, Set<string>> = {};
    const updatedRecordsMap: Record<string, ShipmentRecord> = {};
    const originalRecordsMap: Record<string, ShipmentRecord> = {};

    // 1. Pre-calculate updates using functional parameters
    dirtyIds.forEach((shipmentId) => {
      const currentShipment = shipments.find((s) => s.shipmentId === shipmentId);
      if (!currentShipment) return;

      const existing = manualOverrides[shipmentId] ? new Set(manualOverrides[shipmentId]) : new Set<string>();
      Object.keys(rowUpdates[shipmentId]).forEach((field) => {
        existing.add(field);
      });
      nextManualOverridesMap[shipmentId] = existing;

      const originalRecord = editedRows[shipmentId]?.original || currentShipment;
      originalRecordsMap[shipmentId] = originalRecord;

      const { updatedShipment, autoFills } = applyRowUpdates(currentShipment, rowUpdates[shipmentId], existing);
      updatedRecordsMap[shipmentId] = updatedShipment;

      const filledKeys = Object.keys(autoFills).filter(
        (k) => autoFills[k as keyof ShipmentRecord] !== currentShipment[k as keyof ShipmentRecord]
      );
      if (filledKeys.length > 0) {
        highlightsToTrigger[shipmentId] = filledKeys;
      }
    });

    // 2. Perform batched atomic state updates
    setManualOverrides((prev) => {
      const next = { ...prev };
      Object.assign(next, nextManualOverridesMap);
      return next;
    });

    setShipments((prev) =>
      prev.map((s) => {
        if (updatedRecordsMap[s.shipmentId]) {
          return updatedRecordsMap[s.shipmentId];
        }
        return s;
      })
    );

    setEditedRows((prev) => {
      const next = { ...prev };
      dirtyIds.forEach((shipmentId) => {
        if (updatedRecordsMap[shipmentId]) {
          next[shipmentId] = {
            original: originalRecordsMap[shipmentId],
            current: updatedRecordsMap[shipmentId],
          };
        }
      });
      return next;
    });

    // 3. Trigger highlights
    Object.entries(highlightsToTrigger).forEach(([shipmentId, fields]) => {
      triggerHighlight(shipmentId, fields);
    });
  };

  // Cell Change Handler (Runs Smart Auto-Fill & Business Rules locally)
  const handleCellChange = (shipmentId: string, field: keyof ShipmentRecord, value: any) => {
    pushToUndo(shipments, editedRows, manualOverrides);
    setManualOverrides((prev) => {
      const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
      existing.add(field);
      return { ...prev, [shipmentId]: existing };
    });

    const originalRecord = shipments.find((s) => s.shipmentId === shipmentId)!;
    const currentRecord = { ...originalRecord, [field]: value };
    const autoFills: Partial<ShipmentRecord> = {};

    if (field === "paymentReceivingBranch") {
      // Clear manual override for paymentCompany since payer branch type has changed
      setManualOverrides((prev) => {
        const existing = prev[shipmentId] ? new Set(prev[shipmentId]) : new Set<string>();
        existing.delete("paymentCompany");
        return { ...prev, [shipmentId]: existing };
      });

      if (value === "From Company" && currentRecord.fromCompany) {
        const resolved = resolveCompanyDetails(currentRecord.fromCompany, currentRecord.fromAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
      } else if (value === "To Company" && currentRecord.toCompany) {
        const resolved = resolveCompanyDetails(currentRecord.toCompany, currentRecord.toAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
      }
    }

    if (field === "fromCompany" && currentRecord.paymentReceivingBranch === "From Company") {
      if (!manualOverrides[shipmentId]?.has("paymentCompany")) {
        const resolved = resolveCompanyDetails(value, currentRecord.fromAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
      }
    }
    if (field === "toCompany" && currentRecord.paymentReceivingBranch === "To Company") {
      if (!manualOverrides[shipmentId]?.has("paymentCompany")) {
        const resolved = resolveCompanyDetails(value, currentRecord.toAmtBranch, companies);
        autoFills.paymentCompany = resolved.companyName;
      }
    }

    if (field === "fromAmtBranch") {
      const validFromCompanies = companies.filter((c) => c.branchName === value).map((c) => c.companyName);
      if (currentRecord.fromCompany && !validFromCompanies.includes(currentRecord.fromCompany)) {
        autoFills.fromCompany = "";
      }
    }
    if (field === "toAmtBranch") {
      const validToCompanies = companies.filter((c) => c.branchName === value).map((c) => c.companyName);
      if (currentRecord.toCompany && !validToCompanies.includes(currentRecord.toCompany)) {
        autoFills.toCompany = "";
      }
    }

    // Check global package transition
    const wasGlobal = isGlobalRoutePackage(
      originalRecord.packageType,
      originalRecord.fromAmtBranch,
      originalRecord.toAmtBranch,
      originalRecord.paymentCompany,
      companyRouteRates,
      globalRouteRates,
      companies,
      branches,
      originalRecord.paymentReceivingBranch
    );

    const tempMerged = { ...currentRecord, ...autoFills };
    const isNowGlobal = isGlobalRoutePackage(
      tempMerged.packageType,
      tempMerged.fromAmtBranch,
      tempMerged.toAmtBranch,
      tempMerged.paymentCompany,
      companyRouteRates,
      globalRouteRates,
      companies,
      branches,
      tempMerged.paymentReceivingBranch
    );

    if (isNowGlobal && !wasGlobal) {
      autoFills.pickupService = "Branch";
      autoFills.deliveryService = "Branch";
      autoFills.pickupCharge = 0;
      autoFills.deliveryCharge = 0;
    }

    // Validate package list and clear if no longer valid
    const tempRecord = { ...currentRecord, ...autoFills };
    if (
      field === "fromAmtBranch" ||
      field === "toAmtBranch" ||
      field === "paymentCompany" ||
      field === "paymentReceivingBranch" ||
      ("paymentCompany" in autoFills)
    ) {
      const currentPkg = tempRecord.packageType?.trim();
      if (currentPkg && currentPkg.includes("(")) {
        const validOptions = getFilteredPackageOptions(
          tempRecord.fromAmtBranch,
          tempRecord.toAmtBranch,
          tempRecord.paymentCompany,
          companyRouteRates,
          globalRouteRates,
          companies,
          branches,
          tempRecord.paymentReceivingBranch
        );
        const validValues = validOptions.map(opt => opt.value.toLowerCase().trim());
        if (!validValues.includes(currentPkg.toLowerCase()) && field !== "packageType") {
          autoFills.packageType = "";
        }
      }
    }

    const finalRecord = { ...currentRecord, ...autoFills };

    const pricingTriggerFields = [
      "fromAmtBranch",
      "fromCompany",
      "toAmtBranch",
      "toCompany",
      "packageType",
      "paymentCompany",
      "paymentReceivingBranch",
      "pickupService",
      "deliveryService",
      "quantity",
    ];

    if (pricingTriggerFields.includes(field) || Object.keys(autoFills).some(k => pricingTriggerFields.includes(k))) {
      const calc = calculatePricingLocally(finalRecord);

      if (!manualOverrides[shipmentId]?.has("transportRate")) {
        autoFills.transportRate = calc.transportRate;
        finalRecord.transportRate = calc.transportRate;
      }
      
      autoFills.pickupCharge = calc.pickupCharge;
      finalRecord.pickupCharge = calc.pickupCharge;
      
      autoFills.deliveryCharge = calc.deliveryCharge;
      finalRecord.deliveryCharge = calc.deliveryCharge;

      if (!manualOverrides[shipmentId]?.has("pricePerPiece")) {
        autoFills.pricePerPiece = calc.pricePerPiece;
        finalRecord.pricePerPiece = calc.pricePerPiece;
      }
    }

    if (finalRecord.pricePerPiece !== null && finalRecord.pricePerPiece !== undefined) {
      const qty = calculateQuantity(finalRecord.quantity);
      autoFills.totalAmount = qty * finalRecord.pricePerPiece;
    } else {
      autoFills.totalAmount = null;
    }

    const filledKeys = Object.keys(autoFills).filter(
      (k) => autoFills[k as keyof ShipmentRecord] !== originalRecord[k as keyof ShipmentRecord]
    );
    if (filledKeys.length > 0) {
      triggerHighlight(shipmentId, filledKeys);
    }

    setShipments((prev) =>
      prev.map((s) => (s.shipmentId === shipmentId ? { ...s, ...autoFills, [field]: value } : s))
    );

    setEditedRows((prev) => {
      const existing = prev[shipmentId];
      const original = existing ? existing.original : { ...originalRecord };
      const current = existing ? { ...existing.current } : { ...originalRecord };

      return {
        ...prev,
        [shipmentId]: {
          original,
          current: { ...current, ...autoFills, [field]: value },
        },
      };
    });
  };

  // Discard spreadsheet changes
  const handleDiscardChanges = () => {
    if (Object.keys(editedRows).length === 0) return;
    if (confirm("Are you sure you want to discard all unsaved edits?")) {
      setUndoStack([]);
      setRedoStack([]);
      setEditedRows({});
      setManualOverrides({});
      setShipments((prev) =>
        prev.map((s) => {
          const editState = editedRows[s.shipmentId];
          return editState ? { ...editState.original } : s;
        })
      );
      triggerToast("Unsaved changes discarded.");
    }
  };

  // Save all modified rows
  const handleSaveAllChanges = async () => {
    const dirtyIds = Object.keys(editedRows);
    if (dirtyIds.length === 0) return;

    setSaving(true);
    try {
      const rowsPayload = dirtyIds.map((id) => {
        const editState = editedRows[id];
        const current = editState.current;
        const original = editState.original;

        const updates: any = {};
        Object.keys(current).forEach((key) => {
          const k = key as keyof ShipmentRecord;
          if (current[k] !== original[k]) {
            updates[k] = current[k];
          }
        });
        return { shipmentId: id, updates };
      }).filter((item) => Object.keys(item.updates).length > 0);

      if (rowsPayload.length > 0) {
        const res = await fetch("/api/shipments/bulk", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: rowsPayload }),
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.message || "Failed to update shipments.");
        }
      }

      triggerToast(`Successfully saved updates to ${dirtyIds.length} shipments.`);
      setUndoStack([]);
      setRedoStack([]);
      setEditedRows({});
      setManualOverrides({});
      await fetchShipments();
      await fetchDashboardKPIs();
    } catch (err: any) {
      console.error("Error saving bulk changes:", err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handlePreviewShipment = (shipment: ShipmentRecord) => {
    setModalShipment(shipment);
    setModalMode("preview");
    setIsModalOpen(true);
  };

  const handleEditShipment = (shipment: ShipmentRecord) => {
    setModalShipment(shipment);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleModalSave = async (updated: ShipmentRecord) => {
    try {
      const res = await fetch(`/api/shipments/${updated.shipmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update shipment.");
      }
      triggerToast("Shipment updated successfully.");
      await fetchShipments();
      await fetchDashboardKPIs();
    } catch (err: any) {
      console.error("Error saving modal changes:", err);
      throw err;
    }
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchText("");
    const resetVals: IFilters = {
      search: undefined,
      date: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      fromBranch: undefined,
      toBranch: undefined,
      deliveryStatus: undefined,
      paymentStatus: undefined,
      vehicleNumber: undefined,
      fromCompany: undefined,
      toCompany: undefined,
      company: undefined,
      packageType: undefined,
      pickupService: undefined,
      deliveryService: undefined,
      ourInvoiceNumber: undefined,
      customerInvoiceNumber: undefined,
      ...defaultFilters, // Re-lock default base context filters if passed explicitly
    };
    // Re-lock base context initial values
    if (context.type === "branch") {
      resetVals.fromBranch = resolvedBaseName;
    } else if (context.type === "company") {
      resetVals.company = resolvedBaseName;
    }
    setFilters(resetVals);
    setPage(1);
  };

  const handleFilterChange = (newFilters: IFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Delete Action Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteShipmentId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shipments/${deleteShipmentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        triggerToast(`Shipment ${deleteShipmentId} deleted successfully.`);
        if (editedRows[deleteShipmentId]) {
          const updatedEdits = { ...editedRows };
          delete updatedEdits[deleteShipmentId];
          setEditedRows(updatedEdits);
        }
        setSelectedIds((prev) => prev.filter((id) => id !== deleteShipmentId));
        const isLastItemOnPage = shipments.length === 1;
        if (isLastItemOnPage && page > 1) {
          setPage(page - 1);
        } else {
          await fetchShipments();
        }
        await fetchDashboardKPIs();
      } else {
        throw new Error(json.message || "Could not delete shipment.");
      }
    } catch (err: any) {
      console.error("Error deleting shipment:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteShipmentId(null);
    }
  };

  // Check if context lookup is resolved
  const isContextLoading = context.type !== "global" && !resolvedBaseName;

  let emptyStateMsg = "No shipments found";
  if (filters.month || filters.year) {
    const mStr = filters.month || "";
    const yStr = filters.year || "";
    if (mStr && yStr) {
      emptyStateMsg = `No shipments found for ${mStr} ${yStr}.`;
    } else if (mStr) {
      emptyStateMsg = `No shipments found for ${mStr}.`;
    } else if (yStr) {
      emptyStateMsg = `No shipments found for Year ${yStr}.`;
    }
  }

  const buildPackageOptions = () => {
    const list: any[] = [];
    const seenValues = new Set<string>();

    // 1. Global packages
    const globalPkgs = packages.filter((p) => !p.companyName && p.status === "Active");
    globalPkgs.forEach((p) => {
      const val = p.packageName;
      if (!seenValues.has(val.toLowerCase())) {
        seenValues.add(val.toLowerCase());
        list.push({
          value: val,
          label: `📦 ${val}`,
          badge: "Global",
          badgeType: "global",
        });
      }
    });

    // 2. Company packages
    const companyPkgs = packages.filter((p) => p.companyName && p.status === "Active");
    companyPkgs.forEach((p) => {
      const comp = companies.find((c) => c.companyId === p.companyId);
      const branch = branches.find((b) => b.branchId === comp?.branchId || b.branchName === comp?.branchName);
      
      const bCode = branch?.branchCode || comp?.branchCode || comp?.branchName?.slice(0, 3).toUpperCase() || "";
      const displayBranchCode = bCode ? ` - ${bCode}` : "";
      
      const val = `${p.packageName} (${p.companyName}${displayBranchCode})`;
      if (!seenValues.has(val.toLowerCase())) {
        seenValues.add(val.toLowerCase());
        list.push({
          value: val,
          label: `📦 ${val}`,
          badge: "Company",
          badgeType: "company",
        });
      }
    });

    // 3. Unknown / OCR packages from shipments
    shipmentPackages.forEach((pkgVal) => {
      const isRegistered = packages.some(
        (p) => p.packageName.toLowerCase().trim() === pkgVal.toLowerCase().trim()
      );
      if (!isRegistered && !seenValues.has(pkgVal.toLowerCase())) {
        seenValues.add(pkgVal.toLowerCase());
        list.push({
          value: pkgVal,
          label: `⚠ ${pkgVal}`,
          badge: "Shipment Only",
          badgeType: "shipment",
        });
      }
    });

    return list;
  };

  const packageOptions = buildPackageOptions();

  return (
    <div className="flex-1 flex flex-col p-6 w-full mx-auto relative select-none">
      {/* Header Panel */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            {context.type === "global"
              ? "Global Shipment Register database"
              : `${context.type.toUpperCase()}: ${resolvedBaseName || "Resolving ID..."}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-355 hover:text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      {isContextLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
          <svg className="animate-spin h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-400 font-semibold">Resolving context profile...</span>
        </div>
      ) : (
        <>
          {/* Workspace KPIs Dashboard */}
          {context.type !== "global" && (
            <div className="mt-6">
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

          {/* Action Controls & Search Box */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mt-6 mb-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by vehicle, company, invoice number..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all shadow-md"
              />
            </div>

            {/* Toolbar Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-2xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
                  showFilters
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {Object.values(filters).filter(Boolean).length > 0 && `(${Object.values(filters).filter(Boolean).length})`}
              </button>
            </div>
          </div>

          {/* Advanced Filter Component */}
          <div className="mb-4">
            <ShipmentFilters
              filters={filters}
              onChange={handleFilterChange}
              branches={branches}
              onReset={handleResetFilters}
              visible={showFilters}
              availableYears={availableYears}
              packageOptions={packageOptions}
            />
          </div>

          {/* Spreadsheet Controller Toolbar */}
          <div className="mb-6">
            <ShipmentToolbar
              mode={mode}
              setMode={setMode}
              onSaveAll={handleSaveAllChanges}
              onDiscard={handleDiscardChanges}
              hasChanges={Object.keys(editedRows).length > 0}
              modifiedCount={Object.keys(editedRows).length}
              saving={saving}
              actions={actions}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
            />
          </div>

          {/* Error Alert Display */}
          {errorMsg && (
            <div className="w-full bg-red-950/40 border border-red-900/50 p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs text-red-400 font-semibold">
              <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 flex justify-between items-center">
                <span>{errorMsg}</span>
                <button
                  onClick={fetchShipments}
                  className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 rounded-lg border border-red-700/30 transition-colors text-[10px] uppercase font-bold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Shipment Records Table Component */}
          <div className="flex-1">
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
            <div className="mt-4">
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

          {/* Dynamic Edit / Preview Modal */}
          <ShipmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            shipment={modalShipment}
            mode={modalMode}
            branches={branches}
            companies={companies}
            packages={packages}
            companyRouteRates={companyRouteRates}
            globalRouteRates={globalRouteRates}
            onSave={handleModalSave}
            calculatePricingLocally={calculatePricingLocally}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteShipmentId !== null}
            onCancel={() => setDeleteShipmentId(null)}
            onConfirm={handleDeleteConfirm}
            isDeleting={isDeleting}
          />

          {/* Register verification image viewer */}
          {activeImageDetails && (
            <ImageViewerModal
              imageId={activeImageDetails.imageId}
              imageFileName={activeImageDetails.fileName}
              onClose={() => setActiveImageDetails(null)}
            />
          )}

          {/* Toast Notification Popup */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{toastMessage}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
