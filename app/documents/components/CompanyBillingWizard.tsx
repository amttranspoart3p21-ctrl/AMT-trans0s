"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CompanySearchSelect, { SelectedCompanyInfo } from "./CompanySearchSelect";
import DocumentFilters from "./DocumentFilters";
import TaxInvoicePreview, {
  InvoiceHeaderDetails,
  CustomerDetails,
  BankAccountDetails,
} from "./TaxInvoicePreview";
import Pagination from "@/app/shipments/components/Pagination";
import {
  getSavedBillingProfiles,
  saveBillingProfile,
  deleteBillingProfile,
  BillingProfile,
} from "@/utils/billing-profile";
import { resolvePaymentContext } from "@/utils/shipment-shared";
import type { ShipmentRecord, ShipmentFilters as IFilters } from "@/types/shipment";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";

interface CompanyBillingWizardProps {
  shipments: ShipmentRecord[];
  companies: Company[];
  branches: Branch[];
  availableYears: number[];
  packageOptions: any[];
  filters: IFilters;
  onFiltersChange: (newFilters: IFilters) => void;
  onResetFilters: () => void;
  showFilters?: boolean;
  onCloseFilters?: () => void;
}

export default function CompanyBillingWizard({
  shipments,
  companies,
  branches,
  availableYears,
  packageOptions,
  filters,
  onFiltersChange,
  onResetFilters,
  showFilters = false,
  onCloseFilters,
}: CompanyBillingWizardProps) {
  // Company Selection state
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompanyInfo | null>(null);

  // Invoice Fields State — start empty for every new/unsaved session
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceHeaderDetails>({
    gstinNo: "",
    hsnCodeNo: "",
    invoiceNo: "",
    invoiceDate: "",
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    address: "",
    contactNo: "",
    gstin: "",
  });

  // Bank Account Fields State — start empty for every new/unsaved session
  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    ifscCode: "",
  });

  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<BillingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved billing profile?")) {
      deleteBillingProfile(id);
      setSavedProfiles(getSavedBillingProfiles());
      if (selectedProfileId === id) {
        setSelectedProfileId("");
      }
    }
  };

  const selectedProfile = useMemo(() => {
    return savedProfiles.find((p) => p.id === selectedProfileId) || null;
  }, [savedProfiles, selectedProfileId]);

  // Pagination for screen preview
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    setSavedProfiles(getSavedBillingProfiles());
  }, []);

  // When company selection changes, update customer details and filter query
  useEffect(() => {
    if (selectedCompany) {
      if (selectedCompany.isRegistered && selectedCompany.registeredCompany) {
        const comp = selectedCompany.registeredCompany;
        setCustomerDetails({
          name: comp.companyName,
          address: comp.address || "",
          contactNo: comp.phoneNumber1 || comp.phoneNumber2 || "",
          gstin: comp.gstNumber || "",
        });
      } else {
        setCustomerDetails((prev) => ({
          ...prev,
          name: selectedCompany.companyName,
        }));
      }

      // Update backend filters with company name & branch
      onFiltersChange({
        ...filters,
        company: selectedCompany.companyName,
      });
    } else {
      if (filters.company) {
        const updated = { ...filters };
        delete updated.company;
        onFiltersChange(updated);
      }
    }
  }, [selectedCompany]);

  // Strictly filter shipments based on Payment Branch priority & Company resolution hierarchy
  const filteredShipments = useMemo(() => {
    if (!selectedCompany) return shipments;

    const targetComp = selectedCompany.companyName.toLowerCase().trim();
    const targetBranchCode = selectedCompany.branchCode
      ? selectedCompany.branchCode.toLowerCase().trim()
      : undefined;

    return shipments.filter((s) => {
      // 1. PAYMENT BRANCH HAS PRIORITY
      // Resolve payment context (paymentCompany & paymentBranch) for the shipment
      const { paymentCompany, paymentBranch } = resolvePaymentContext(s, branches);

      // Rule 7 & Test 4: Missing/empty paymentReceivingBranch -> EXCLUDE!
      if (!paymentCompany || !paymentBranch) {
        return false;
      }

      const pComp = paymentCompany.toLowerCase().trim();
      const pBranch = paymentBranch.toLowerCase().trim();

      // Rule 5 & Test 5: Registered Company Selection (Name + Branch match required)
      if (selectedCompany.isRegistered) {
        const matchesComp = pComp === targetComp;
        const matchesBranch = targetBranchCode ? pBranch === targetBranchCode : true;
        return matchesComp && matchesBranch;
      }

      // Rule 6: Unregistered Company Search (Payer company must match search term)
      return pComp.includes(targetComp);
    });
  }, [shipments, selectedCompany, branches]);

  const totalPages = Math.ceil(filteredShipments.length / limit);
  const paginatedShipments = useMemo(() => {
    return filteredShipments.slice((page - 1) * limit, page * limit);
  }, [filteredShipments, page, limit]);

  useEffect(() => {
    if (page > 1 && page > totalPages) setPage(1);
  }, [filteredShipments.length, limit, totalPages, page]);

  // Handle Saved Profile Application
  const handleApplySavedProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (!profileId) return;

    const prof = savedProfiles.find((p) => p.id === profileId);
    if (prof) {
      if (prof.bankDetails) {
        setBankDetails(prof.bankDetails);
      }
    }
  };

  // Handle Saving Details to LocalStorage
  const handleSaveDetails = () => {
    if (!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim()) {
      alert("Please enter bank account details before saving.");
      return;
    }

    const profileName = `${bankDetails.bankName} - ${bankDetails.accountName}`;

    saveBillingProfile({
      profileName,
      bankDetails,
    });

    setSavedProfiles(getSavedBillingProfiles());
    setSaveSuccessMsg(`Bank profile saved for "${profileName}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* 1. EXPANDABLE BILLING & SHIPMENT FILTERS SECTION (Screen Only) */}
      {showFilters && (
        <div className="no-print bg-white dark:bg-[#18191A] border border-slate-200/90 dark:border-zinc-800 p-5 rounded-xl shadow-xs flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
          {/* Top Row: Billing Company Selector & Saved Billing Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <CompanySearchSelect
              companies={companies}
              branches={branches}
              selectedCompany={selectedCompany}
              onSelectCompany={setSelectedCompany}
            />

            {/* Saved Billing Profiles Selector */}
            <div className="relative w-full" ref={profileDropdownRef}>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 block">
                Use Saved Billing Profile?
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">
                    {selectedProfile ? (
                      <span className="font-bold text-slate-900 dark:text-zinc-100">
                        {selectedProfile.profileName}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500">
                        -- Create New / Unsaved Profile --
                      </span>
                    )}
                  </span>
                </button>

                {/* Left Bank Icon */}
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </span>

                {/* Right controls: Clear (if selected) + Rotating Chevron */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                  {selectedProfileId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplySavedProfile("");
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Clear selection"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <span className="pointer-events-none text-slate-400 dark:text-zinc-500">
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                {selectedProfile ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                    <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Saved Profile Active ({selectedProfile.bankDetails?.bankName || "Bank"} - {selectedProfile.bankDetails?.accountName || ""})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-bold uppercase tracking-wider">
                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Custom / Unsaved Billing Mode</span>
                  </span>
                )}
              </div>

              {/* Dropdown Options Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Saved Billing Profiles ({savedProfiles.length})</span>
                    <span className="text-[8.5px] text-slate-400 font-normal">Select or create new</span>
                  </div>

                  {/* Option 1: Unsaved / Create New */}
                  <button
                    type="button"
                    onClick={() => {
                      handleApplySavedProfile("");
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 dark:border-zinc-800/40 ${
                      !selectedProfileId ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 block">
                          -- Create New / Unsaved Profile --
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Enter custom details in the form sidebar
                        </span>
                      </div>
                    </div>
                    {!selectedProfileId && (
                      <span className="text-sky-600 dark:text-sky-400 font-black text-xs">✓</span>
                    )}
                  </button>

                  {/* Saved Profile items */}
                  {savedProfiles.map((p) => {
                    const isSelected = selectedProfileId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleApplySavedProfile(p.id);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 dark:border-zinc-800/40 last:border-0 group ${
                          isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate">
                              {p.profileName}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                              A/C: {p.bankDetails?.accountNumber || "-"} ({p.bankDetails?.bankName || ""})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">✓</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProfile(e, p.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded transition-all cursor-pointer"
                            title="Delete this saved profile"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Shipment Filters Grid */}
          <div>
            <DocumentFilters
              filters={filters}
              onChange={onFiltersChange}
              branches={branches}
              onReset={onResetFilters}
              visible={true}
              availableYears={availableYears}
              packageOptions={packageOptions}
              onClose={onCloseFilters}
            />
          </div>
        </div>
      )}

      {/* 2. Split Workspace: Left Sidebar Form & Right Document Preview */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-3">
        {/* Left Column: Form Sidebar Panel (Screen only) */}
        <div className="no-print w-full lg:w-[330px] xl:w-[360px] 2xl:w-[380px] shrink-0 bg-white dark:bg-[#18191A] border border-slate-200/90 dark:border-zinc-800 p-3.5 sm:p-4 rounded-xl shadow-xs flex flex-col gap-3 max-h-[calc(97vh-140px)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                Invoice Details
              </h3>
              <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 font-medium">Configure metadata for tax invoice</p>
            </div>
          </div>

          {/* Stacked Form Cards in vertical column */}
          <div className="flex flex-col gap-3">
            {/* 1. Invoice Header Details */}
            <div className="bg-slate-50/80 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-zinc-800 pb-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400 text-[9px] font-black">1</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-400">
                  Invoice Header Info
                </span>
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Transporter GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 33AABCA1234F1Z5"
                  value={invoiceDetails.gstinNo}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, gstinNo: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">HSN Code No</label>
                <input
                  type="text"
                  placeholder="e.g. 996511"
                  value={invoiceDetails.hsnCodeNo}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, hsnCodeNo: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Invoice No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-001"
                    value={invoiceDetails.invoiceNo}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNo: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Invoice Date</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={invoiceDetails.invoiceDate}
                    onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceDate: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* 2. Customer / Billed To Info */}
            <div className="bg-slate-50/80 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-zinc-800 pb-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-400 text-[9px] font-black">2</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-800 dark:text-violet-400">
                  Billed Customer Details
                </span>
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Customer / Company Name</label>
                <input
                  type="text"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  placeholder="Enter customer name..."
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Billing Address</label>
                <textarea
                  rows={2}
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  placeholder="Enter billing address..."
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-2xs mt-0.5 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Contact No</label>
                  <input
                    type="text"
                    value={customerDetails.contactNo}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, contactNo: e.target.value })}
                    placeholder="Contact number..."
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Customer GSTIN</label>
                  <input
                    type="text"
                    value={customerDetails.gstin}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, gstin: e.target.value })}
                    placeholder="Customer GSTIN..."
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* 3. Bank Account Details */}
            <div className="bg-slate-50/80 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex flex-col gap-2 shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-zinc-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-[9px] font-black">3</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Transporter Bank Account
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Profile</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-md text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 animate-fade-in flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. TMS TRANSOS"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 50200012345678"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Ambur Branch"
                    value={bankDetails.branch}
                    onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs mt-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9.5px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tax Invoice Document Preview Sheet */}
        <div className="flex-1 w-full min-w-0 flex flex-col items-center">
          {/* Screen View (Paginated Table) */}
          <div className="w-full no-print flex flex-col items-center">
            <TaxInvoicePreview
              shipments={paginatedShipments}
              branches={branches}
              invoiceDetails={invoiceDetails}
              customerDetails={customerDetails}
              bankDetails={bankDetails}
            />
            <div className="w-full max-w-[1000px] mt-3">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                totalRecords={filteredShipments.length}
                limitOptions={[15, 25, 50, 100]}
              />
            </div>
          </div>

          {/* Print View (Full filtered dataset) */}
          <div className="print-table-container w-full">
            <TaxInvoicePreview
              shipments={filteredShipments}
              branches={branches}
              invoiceDetails={invoiceDetails}
              customerDetails={customerDetails}
              bankDetails={bankDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
