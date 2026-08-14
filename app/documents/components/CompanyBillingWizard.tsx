"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
}: CompanyBillingWizardProps) {
  // Company Selection state
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompanyInfo | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Invoice Fields State
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceHeaderDetails>({
    gstinNo: "33AABCA1234F1Z5",
    hsnCodeNo: "996511",
    invoiceNo: `TS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/001`,
    invoiceDate: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  });

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    address: "",
    contactNo: "",
    gstin: "",
  });

  const [bankDetails, setBankDetails] = useState<BankAccountDetails>({
    accountName: "TMS TRANSOS",
    accountNumber: "123456789012",
    bankName: "HDFC Bank",
    branch: "Ambur",
    ifscCode: "HDFC0001234",
  });

  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<BillingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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

  // Resolve branch code helper for accurate branch matching
  const resolveBranchCode = useCallback(
    (clean: string): string => {
      if (!clean) return "";
      const match = branches.find(
        (b) =>
          b.branchCode.toLowerCase() === clean.toLowerCase() ||
          b.branchName.toLowerCase() === clean.toLowerCase() ||
          b.branchId.toLowerCase() === clean.toLowerCase()
      );
      return match ? match.branchCode : clean;
    },
    [branches]
  );

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* 1. BILLING FILTERS & SELECTION SECTION (Screen Only) */}
      <div className="no-print bg-slate-905 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Company Billing Configuration & Filters
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Select or search target company, apply shipment filters, and configure invoice details
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showAdvancedFilters ? "Hide Shipment Filters" : "Shipment Filters"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredShipments.length === 0}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-600/30 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Generate & Print Invoice
            </button>
          </div>
        </div>

        {/* Company Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompanySearchSelect
            companies={companies}
            branches={branches}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />

          {/* Saved Billing Profiles Selector */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Use Saved Billing Profile?
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedProfileId}
                onChange={(e) => handleApplySavedProfile(e.target.value)}
                className="flex-1 bg-slate-955 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                <option value="">-- Create New / Unsaved Profile --</option>
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.profileName} {p.companyName ? `(${p.companyName})` : ""}
                  </option>
                ))}
              </select>

              {selectedProfileId && (
                <button
                  type="button"
                  onClick={() => handleApplySavedProfile("")}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs rounded-xl font-bold border border-slate-700 transition-colors"
                  title="Clear selected profile"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Advanced Shipment Filters */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-800">
            <DocumentFilters
              filters={filters}
              onChange={onFiltersChange}
              branches={branches}
              onReset={onResetFilters}
              visible={true}
              availableYears={availableYears}
              packageOptions={packageOptions}
            />
          </div>
        )}
      </div>

      {/* 2. INVOICE EDITABLE METADATA FORM (Screen Only) */}
      <div className="no-print bg-slate-905 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Editable Tax Invoice & Customer Details
          </h3>
          <div className="flex items-center gap-3">
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-400 animate-fade-in">
                ✓ {saveSuccessMsg}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDetails}
              className="px-3.5 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Save Profile Details
            </button>
          </div>
        </div>

        {/* Form Input Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Header Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 block border-b border-slate-800 pb-1.5">
              Invoice Header Info
            </span>
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase">Transporter GSTIN</label>
              <input
                type="text"
                value={invoiceDetails.gstinNo}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, gstinNo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase">HSN Code No</label>
              <input
                type="text"
                value={invoiceDetails.hsnCodeNo}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, hsnCodeNo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Invoice No</label>
                <input
                  type="text"
                  value={invoiceDetails.invoiceNo}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Invoice Date</label>
                <input
                  type="text"
                  value={invoiceDetails.invoiceDate}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Customer / Billed To Info */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-400 block border-b border-slate-800 pb-1.5">
              Billed Customer Details
            </span>
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase">Customer / Company Name</label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                placeholder="Enter customer name..."
                className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase">Billing Address</label>
              <input
                type="text"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                placeholder="Enter billing address..."
                className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Contact No</label>
                <input
                  type="text"
                  value={customerDetails.contactNo}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, contactNo: e.target.value })}
                  placeholder="Contact number..."
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Customer GSTIN</label>
                <input
                  type="text"
                  value={customerDetails.gstin}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, gstin: e.target.value })}
                  placeholder="Customer GSTIN..."
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block border-b border-slate-800 pb-1.5">
              Transporter Bank Account
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Account Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">Branch</label>
                <input
                  type="text"
                  value={bankDetails.branch}
                  onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-400 uppercase">IFSC Code</label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 mt-1 outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAX INVOICE PREVIEW SECTION */}
      <div className="w-full flex flex-col items-center">
        {/* Screen View (Paginated Table) */}
        <div className="w-full no-print flex flex-col items-center">
          <TaxInvoicePreview
            shipments={paginatedShipments}
            branches={branches}
            invoiceDetails={invoiceDetails}
            customerDetails={customerDetails}
            bankDetails={bankDetails}
          />
          <div className="w-full max-w-[1000px] mt-4">
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
  );
}
