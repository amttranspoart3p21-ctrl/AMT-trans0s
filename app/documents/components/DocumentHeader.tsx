import React from "react";
import type { BrandingConfig } from "./document-config";

interface DocumentHeaderProps {
  title: string;
  branding: BrandingConfig;
  branchName?: string;
  companyName?: string;
  dateRange?: string;
  generatedDate: string;
}

export default function DocumentHeader({
  title,
  branding,
  branchName,
  companyName,
  dateRange,
  generatedDate,
}: DocumentHeaderProps) {
  return (
    <div className="doc-header-container border-b-2 border-slate-900 pb-6 mb-8 flex flex-col gap-6">
      {/* 1. Header Corporate Branding Row */}
      <div className="doc-branding-row flex justify-between items-start gap-4">
        <div className="doc-branding-info flex-1">
          <h2 className="doc-company-name text-xl font-black tracking-tight text-slate-900">
            {branding.companyName}
          </h2>
          <p className="doc-company-address text-xs text-slate-650 mt-1 font-medium leading-relaxed max-w-md">
            {branding.address}
          </p>
          <div className="doc-company-contact text-[10px] text-slate-500 font-semibold mt-1.5 flex flex-col gap-0.5">
            <span>📞 Phone: {branding.phone}</span>
            <span>✉️ Email: {branding.email}</span>
            <span className="text-slate-800 font-bold uppercase">GSTIN: {branding.gstNumber}</span>
          </div>
        </div>

        {/* Logo Placeholder Box */}
        <div className="doc-logo-box h-16 w-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center shrink-0 text-slate-400 font-bold text-[10px] tracking-wider select-none bg-slate-50">
          LOGO
        </div>
      </div>

      {/* 2. Document Title Panel */}
      <div className="doc-title-panel flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-t border-slate-100 pt-4">
        <div>
          <span className="doc-title-badge text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-0.5 block">
            Official Document
          </span>
          <h1 className="doc-title-text text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
            {title}
          </h1>
        </div>
        <div className="doc-title-meta text-right text-[10px] text-slate-500 font-bold flex flex-col gap-0.5 items-end">
          <span>Generated: {generatedDate}</span>
          {dateRange && <span className="text-slate-800">Period: {dateRange}</span>}
        </div>
      </div>

      {/* 3. Branch / Company Context Specific Metadata Cards */}
      {(branchName || companyName) && (
        <div className="doc-context-block grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {branchName && (
            <div>
               <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">
                Target Branch
              </span>
              <span className="text-xs font-bold text-slate-800">{branchName}</span>
            </div>
          )}
          {companyName && (
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">
                Target Company
              </span>
              <span className="text-xs font-bold text-slate-800">{companyName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
