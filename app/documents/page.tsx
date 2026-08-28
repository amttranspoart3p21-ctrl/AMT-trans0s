"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import type { ShipmentRecord, ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";

// Import components
import DocumentFilters from "./components/DocumentFilters";
import DocumentToolbar from "./components/DocumentToolbar";
import DocumentPreview from "./components/DocumentPreview";
import CompanyBillingWizard from "./components/CompanyBillingWizard";
import { documentConfigurations } from "./components/document-config";
import { buildPackageOptions } from "@/app/shipments/utils/packageOptions";

export default function DocumentsPage() {
  // Document Type Selector State
  const [docType, setDocType] = useState<string>("shipment");

  // Filter States
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
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Data States
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active master list lookups
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [shipmentPackages, setShipmentPackages] = useState<string[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [branchRes, compRes, yearRes, pkgRes] = await Promise.all([
          fetch("/api/branches?status=Active"),
          fetch("/api/companies?status=Active"),
          fetch("/api/shipments/years"),
          fetch("/api/packages?status=Active"),
        ]);
        if (branchRes.ok) {
          const json = await branchRes.json();
          if (json.success && Array.isArray(json.data)) setBranches(json.data);
        }
        if (compRes.ok) {
          const json = await compRes.json();
          if (json.companies) setCompanies(json.companies);
        }
        if (yearRes.ok) {
          const json = await yearRes.json();
          if (json.success && Array.isArray(json.years)) setAvailableYears(json.years);
        }
        if (pkgRes.ok) {
          const json = await pkgRes.json();
          if (json.packages) setPackages(json.packages);
        }
      } catch (err) {
        console.error("Error fetching documents master data:", err);
      }
    };
    fetchMasterData();
  }, []);

  // Main fetch call (retrieves all matching shipments without pagination limit to calculate summaries accurately)
  const fetchDocumentData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const fetchShipmentPackages = async () => {
        try {
          const p = new URLSearchParams();
          if (filters.month) p.append("month", filters.month);
          if (filters.year) p.append("year", filters.year);
          if (filters.fromBranch) p.append("fromBranch", filters.fromBranch);
          if (filters.toBranch) p.append("toBranch", filters.toBranch);
          if (filters.company) p.append("company", filters.company);

          const r = await fetch(`/api/shipments/packages?${p.toString()}`);
          if (r.ok) {
            const j = await r.json();
            if (j.success && Array.isArray(j.packages)) {
              setShipmentPackages(j.packages);
            }
          }
        } catch (err) {
          console.error("Error fetching packages in docs page:", err);
        }
      };
      fetchShipmentPackages();

      const params = new URLSearchParams();
      // Notice: Do NOT pass limit/page parameters to fetch the full matching document rows!
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
      if (!res.ok) throw new Error("Failed to load shipment records.");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setShipments(json.data);
      } else {
        throw new Error(json.message || "Could not retrieve shipments data.");
      }
    } catch (err: any) {
      console.error("Error loading document shipments:", err);
      setErrorMsg(err.message || "Failed to load document records.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocumentData();
  }, [filters, fetchDocumentData]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
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
    });
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };


  // Excel Export handler linking to the server-side generator API
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.append("type", docType);
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, String(val));
    });
    window.location.href = `/api/documents/export?${params.toString()}`;
  };

  // Resolve active config details based on type selection
  const activeConfig = documentConfigurations[docType] || documentConfigurations.shipment;

  // Resolve Context names dynamically for header metadata display
  const branchName = filters.fromBranch || undefined;
  const companyName = filters.company || filters.fromCompany || filters.toCompany || undefined;

  // Dynamic Date Range string
  const dateRangeStr =
    filters.dateFrom && filters.dateTo
      ? `${filters.dateFrom} to ${filters.dateTo}`
      : filters.date
      ? filters.date
      : undefined;

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const packageOptions = buildPackageOptions(packages, companies, branches, shipmentPackages);

  // Handle document tab change and automatically reset all filters
  const handleDocTypeChange = (newType: string) => {
    if (newType !== docType) {
      setDocType(newType);
      setFilters({}); // Automatically reset filters on tab switch
    }
  };

  return (
    <Layout>
      <div className="doc-page-container flex-1 flex flex-col p-2 sm:p-3 md:p-4 w-full mx-auto relative select-none">
        {/* Global Documents Action Toolbar */}
        <div className="no-print mb-2">
          <DocumentToolbar
            docType={docType}
            onDocTypeChange={handleDocTypeChange}
            onFiltersToggle={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            activeFiltersCount={activeFiltersCount}
            onPrint={handlePrint}
            onExportExcel={handleExportExcel}
          />
        </div>

        {/* Advanced Filter Wrapper (for Shipment Statement) */}
        {docType !== "billing" && (
          <div className="no-print mb-2">
            <DocumentFilters
              filters={filters}
              onChange={setFilters}
              branches={branches}
              onReset={handleResetFilters}
              visible={showFilters}
              availableYears={availableYears}
              packageOptions={packageOptions}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Main Document Preview Layout Panel */}
        <div className="doc-preview-wrapper flex-1 flex flex-col items-center w-full">
          {docType === "billing" ? (
            <CompanyBillingWizard
              shipments={shipments}
              companies={companies}
              branches={branches}
              availableYears={availableYears}
              packageOptions={packageOptions}
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={handleResetFilters}
              showFilters={showFilters}
              onCloseFilters={() => setShowFilters(false)}
            />
          ) : loading ? (
            <div className="w-full bg-white dark:bg-slate-900/40 border border-slate-200/90 dark:border-slate-850 p-20 rounded-2xl flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-8 w-8 text-sky-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Evaluating document preview datasets...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="w-full bg-red-950/40 border border-red-900/50 p-6 rounded-2xl text-center text-xs text-red-400 font-semibold flex flex-col items-center gap-3">
              <span>{errorMsg}</span>
              <button
                onClick={fetchDocumentData}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-xl border border-red-800/40 transition-colors uppercase font-bold text-[10px]"
              >
                Retry Database Fetch
              </button>
            </div>
          ) : shipments.length === 0 ? (
            <div className="w-full bg-slate-900/40 border border-slate-850 p-20 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-850/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-350">No Matching Shipments Found</span>
              <span className="text-[10px] text-slate-550 max-w-xs leading-normal">
                We couldn't find any shipments matching the active filter parameters. Try adjusting the search query or resetting filters.
              </span>
            </div>
          ) : (
            <DocumentPreview
              config={activeConfig}
              shipments={shipments}
              branchName={branchName}
              companyName={companyName}
              dateRange={dateRangeStr}
              generatedDate={todayStr}
              branches={branches}
              filters={filters}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
