"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ShipmentRecord, ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";

// Import components
import DocumentFilters from "./components/DocumentFilters";
import DocumentToolbar from "./components/DocumentToolbar";
import DocumentPreview from "./components/DocumentPreview";
import { documentConfigurations } from "./components/document-config";

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

  // Fetch active branch/company lists on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [branchRes, compRes] = await Promise.all([
          fetch("/api/branches?status=Active"),
          fetch("/api/companies?status=Active"),
        ]);
        if (branchRes.ok) {
          const json = await branchRes.json();
          if (json.success && Array.isArray(json.data)) setBranches(json.data);
        }
        if (compRes.ok) {
          const json = await compRes.json();
          if (json.companies) setCompanies(json.companies);
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

  // PDF Export handler using on-demand html2pdf.js CDN injection
  const handleExportPDF = () => {
    const element = document.getElementById("printable-document");
    if (!element) return;

    const scriptId = "html2pdf-cdn-script";
    const runExport = () => {
      const opt = {
        margin: 10,
        filename: `${docType}-statement.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };
      // @ts-ignore
      window.html2pdf().from(element).set(opt).save();
    };

    if (document.getElementById(scriptId)) {
      runExport();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = runExport;
      document.body.appendChild(script);
    }
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

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto relative select-none">
      {/* Header Panel */}
      <header className="no-print flex justify-between items-center pb-6 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Documents Center
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Generate and preview official statements, invoices, and logistics summaries
          </p>
        </div>
        <div>
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

      {/* Selector & Action Toolbar Layout Grid */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Document Type Selector Card */}
        <div className="bg-slate-905 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-lg backdrop-blur-md">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Document Template
          </label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-2.5 outline-none cursor-pointer focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none shadow-md"
            >
              <option value="shipment">Shipment Statement</option>
              <option value="branch">Branch Statement</option>
              <option value="company">Company Statement</option>
              <option value="vehicle">Vehicle Statement</option>
              <option value="payment">Payment Statement</option>
              <option value="billing">Tax Invoice (Billing)</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Global Documents Action Toolbar */}
        <div className="lg:col-span-3">
          <DocumentToolbar
            onFiltersToggle={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            activeFiltersCount={activeFiltersCount}
            onPrint={handlePrint}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        </div>
      </div>

      {/* Advanced Filter Wrapper */}
      <div className="no-print mb-6">
        <DocumentFilters
          filters={filters}
          onChange={setFilters}
          branches={branches}
          onReset={handleResetFilters}
          visible={showFilters}
        />
      </div>

      {/* Main Document Preview Layout Panel */}
      <div className="flex-1 flex flex-col items-center">
        {loading ? (
          <div className="w-full bg-slate-900/40 border border-slate-850 p-20 rounded-2xl flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24">
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
          />
        )}
      </div>
    </div>
  );
}
