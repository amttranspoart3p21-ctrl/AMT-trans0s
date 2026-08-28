import React from "react";
import type { BrandingConfig } from "./document-config";
import type { ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";

interface DocumentHeaderProps {
  title: string;
  branding: BrandingConfig;
  branchName?: string;
  companyName?: string;
  dateRange?: string;
  generatedDate: string;
  filters?: IFilters;
  branches?: Branch[];
}

export default function DocumentHeader({
  title,
  branding,
  branchName,
  companyName,
  dateRange,
  generatedDate,
  filters,
  branches = [],
}: DocumentHeaderProps) {
  // Collect all active applied filters to display in the header summary card
  const activeBadges: { label: string; value: string; icon: React.ReactNode }[] = [];

  const resolveBranch = (val?: string) => {
    if (!val) return "";
    const b = branches.find(
      (item) => item.branchId === val || item.branchCode?.toLowerCase() === val.toLowerCase() || item.branchName?.toLowerCase() === val.toLowerCase()
    );
    return b ? `${b.branchName} (${b.branchCode})` : val;
  };

  const targetBranch = branchName || "";
  if (targetBranch) {
    activeBadges.push({
      label: "Target Branch",
      value: targetBranch,
      icon: (
        <svg className="w-3 h-3 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    });
  }

  if (filters?.fromBranch && !targetBranch.includes(filters.fromBranch)) {
    activeBadges.push({
      label: "From Branch",
      value: resolveBranch(filters.fromBranch),
      icon: (
        <svg className="w-3 h-3 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
  }

  if (filters?.toBranch && !targetBranch.includes(filters.toBranch)) {
    activeBadges.push({
      label: "To Branch",
      value: resolveBranch(filters.toBranch),
      icon: (
        <svg className="w-3 h-3 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
  }

  const targetComp = companyName || filters?.company || "";
  if (targetComp) {
    activeBadges.push({
      label: "Company",
      value: targetComp,
      icon: (
        <svg className="w-3 h-3 text-violet-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    });
  }

  if (filters?.fromCompany && filters.fromCompany !== targetComp) {
    activeBadges.push({
      label: "From Company",
      value: filters.fromCompany,
      icon: (
        <svg className="w-3 h-3 text-violet-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    });
  }

  if (filters?.toCompany && filters.toCompany !== targetComp) {
    activeBadges.push({
      label: "To Company",
      value: filters.toCompany,
      icon: (
        <svg className="w-3 h-3 text-violet-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    });
  }

  if (filters?.vehicleNumber) {
    activeBadges.push({
      label: "Vehicle No",
      value: filters.vehicleNumber,
      icon: (
        <svg className="w-3 h-3 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 17h1m10 0h1m2-7h-4V5H4v12h2m13 0h1a1 1 0 001-1v-4.586a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0017.586 8H16v2z" />
        </svg>
      ),
    });
  }

  if (filters?.packageType) {
    activeBadges.push({
      label: "Package Type",
      value: filters.packageType,
      icon: (
        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    });
  }

  if (filters?.deliveryStatus) {
    activeBadges.push({
      label: "Delivery Status",
      value: filters.deliveryStatus,
      icon: (
        <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  if (filters?.paymentStatus) {
    activeBadges.push({
      label: "Payment Status",
      value: filters.paymentStatus,
      icon: (
        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  if (filters?.dateFrom && filters?.dateTo) {
    activeBadges.push({
      label: "Date Range",
      value: `${filters.dateFrom} to ${filters.dateTo}`,
      icon: (
        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
  } else if (filters?.date) {
    activeBadges.push({
      label: "Date",
      value: filters.date,
      icon: (
        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
  } else if (filters?.month || filters?.year) {
    activeBadges.push({
      label: "Period",
      value: [filters.month, filters.year].filter(Boolean).join(" "),
      icon: (
        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
  }

  if (filters?.ourInvoiceNumber) {
    activeBadges.push({
      label: "TS Inv No",
      value: filters.ourInvoiceNumber,
      icon: (
        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
  }

  if (filters?.customerInvoiceNumber) {
    activeBadges.push({
      label: "Co. Inv No",
      value: filters.customerInvoiceNumber,
      icon: (
        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
  }

  return (
    <div className="doc-header-container border-b-2 border-slate-900 pb-3 mb-3 flex flex-col gap-2.5">
      {/* 1. Header Corporate Branding Row */}
      <div className="doc-branding-row flex justify-between items-start gap-4">
        <div className="doc-branding-info flex-1">
          <h2 className="doc-company-name text-xl font-black tracking-tight text-slate-900">
            {branding.companyName}
          </h2>
          <p className="doc-company-address text-xs text-slate-650 mt-0.5 font-medium leading-relaxed max-w-md">
            {branding.address}
          </p>
          <div className="doc-company-contact text-[10.5px] text-slate-600 font-semibold mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{branding.phone}</span>
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{branding.email}</span>
            </span>
            <span className="text-slate-800 font-bold uppercase tracking-wider">
              GSTIN: {branding.gstNumber}
            </span>
          </div>
        </div>

        {/* Logo: show saved image or placeholder */}
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Company Logo"
            className="doc-logo-box h-14 w-14 object-contain rounded-lg shrink-0 border border-slate-200"
          />
        ) : (
          <div className="doc-logo-box h-14 w-14 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center shrink-0 text-slate-400 font-bold text-[10px] tracking-wider select-none bg-slate-50">
            LOGO
          </div>
        )}
      </div>

      {/* 2. Document Title Panel */}
      <div className="doc-title-panel flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-t border-slate-150 pt-2.5">
        <div>
          <span className="doc-title-badge text-[9.5px] font-extrabold uppercase tracking-widest text-sky-600 mb-0.5 block">
            Official Document
          </span>
          <h1 className="doc-title-text text-xl font-black tracking-tight text-slate-900 uppercase">
            {title}
          </h1>
        </div>
        <div className="doc-title-meta text-right text-[10px] text-slate-500 font-semibold flex flex-col gap-0.5 items-end">
          <span>Generated: <strong className="text-slate-800 font-bold">{generatedDate}</strong></span>
          {dateRange && <span>Period: <strong className="text-slate-800 font-bold">{dateRange}</strong></span>}
        </div>
      </div>

      {/* 3. Applied Filters Metadata Panel */}
      {activeBadges.length > 0 && (
        <div className="doc-context-block bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 sm:p-3 select-text">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700">
              <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Applied Filter Parameters ({activeBadges.length})</span>
            </div>
            <span className="text-[9px] font-semibold text-slate-400">Statement Criteria</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {activeBadges.map((badge, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 flex flex-col gap-0.5 shadow-2xs">
                <div className="flex items-center gap-1 text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500">
                  {badge.icon}
                  <span className="truncate">{badge.label}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900 truncate" title={badge.value}>
                  {badge.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
