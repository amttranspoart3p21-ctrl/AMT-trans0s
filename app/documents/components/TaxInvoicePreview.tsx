"use client";

import React, { useState, useEffect } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import { getCompanySettings, DEFAULT_COMPANY_SETTINGS, type CompanySettings } from "@/utils/settings";
import { resolveBranchCode, formatCurrency, formatDate } from "../utils/documentFormatters";

export interface InvoiceHeaderDetails {
  gstinNo: string;
  hsnCodeNo: string;
  invoiceNo: string;
  invoiceDate: string;
}

export interface CustomerDetails {
  name: string;
  address: string;
  contactNo: string;
  gstin: string;
}

export interface BankAccountDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  ifscCode: string;
}

interface TaxInvoicePreviewProps {
  shipments: ShipmentRecord[];
  branches?: Branch[];
  invoiceDetails: InvoiceHeaderDetails;
  customerDetails: CustomerDetails;
  bankDetails: BankAccountDetails;
}

export default function TaxInvoicePreview({
  shipments,
  branches = [],
  invoiceDetails,
  customerDetails,
  bankDetails,
}: TaxInvoicePreviewProps) {
  // Load company settings from localStorage (client-side only)
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  useEffect(() => {
    setSettings(getCompanySettings());
  }, []);

  const phoneDisplay = [settings.phoneNumber1, settings.phoneNumber2]
    .filter(Boolean)
    .join(" / ");

  const formatCompanyBranch = (company: string | undefined, branchVal: string | undefined): string => {
    const comp = (company || "").trim();
    const bCode = resolveBranchCode(branchVal || "", branches);
    const branchStr = bCode && bCode !== "-" ? bCode : (branchVal || "").trim();

    if (comp && branchStr) {
      return `${comp} - ${branchStr}`;
    }
    return comp || branchStr || "-";
  };

  const formatPaymentCompany = (s: ShipmentRecord): string => {
    const comp = (s.paymentCompany || "").trim();
    if (!comp) return "-";

    let branchVal = (s.paymentReceivingBranch || "").trim();
    if (branchVal.toLowerCase() === "from company" || branchVal.toLowerCase() === "from branch") {
      branchVal = s.fromAmtBranch || "";
    } else if (branchVal.toLowerCase() === "to company" || branchVal.toLowerCase() === "to branch") {
      branchVal = s.toAmtBranch || "";
    }

    const bCode = resolveBranchCode(branchVal, branches);
    const branchStr = bCode && bCode !== "-" ? bCode : branchVal;

    if (comp && branchStr) {
      return `${comp} - ${branchStr}`;
    }
    return comp || branchStr || "-";
  };

  // Total amount calculation from filtered shipments
  const subtotal = shipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  return (
    <div className="w-full doc-layout-outer flex justify-center overflow-x-auto select-text">
      <div
        id="printable-document"
        className="tax-invoice-document w-full max-w-[1320px] bg-white text-slate-900 shadow-md rounded-xl p-3.5 sm:p-5 flex flex-col justify-start relative border border-slate-200"
      >
        {/* 1. Header Corporate Branding */}
        <div className="tax-invoice-header doc-header-container border-b-2 border-slate-900 pb-2.5 mb-2.5 flex flex-col gap-2">
          <div className="doc-branding-row flex justify-between items-start gap-4">
            <div className="doc-branding-info flex-1">
              <h2 className="doc-company-name text-xl font-black tracking-tight text-slate-900 uppercase">
                {settings.companyName || DEFAULT_COMPANY_SETTINGS.companyName}
              </h2>
              <p className="doc-company-address text-xs text-slate-600 mt-0.5 font-medium leading-relaxed max-w-md">
                {settings.address || DEFAULT_COMPANY_SETTINGS.address}
              </p>
              <div className="doc-company-contact text-[10.5px] text-slate-600 font-semibold mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                {phoneDisplay && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{phoneDisplay}</span>
                  </span>
                )}
                {settings.email && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{settings.email}</span>
                  </span>
                )}
                {invoiceDetails.gstinNo && (
                  <span className="text-slate-800 font-bold uppercase tracking-wider">
                    GSTIN: {invoiceDetails.gstinNo}
                  </span>
                )}
              </div>
            </div>

            {/* Logo & Generated Date */}
            <div className="flex flex-col items-end shrink-0 gap-1">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Company Logo"
                  className="doc-logo-box h-14 w-14 object-contain rounded-lg shrink-0 border border-slate-200"
                />
              ) : (
                <div className="doc-logo-box h-14 w-14 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center shrink-0 text-slate-400 font-bold text-[10px] tracking-wider select-none bg-slate-50">
                  LOGO
                </div>
              )}
              <span className="text-[9.5px] text-slate-500 font-semibold whitespace-nowrap">
                Generated: <strong className="text-slate-800 font-bold">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Invoice & Customer Details Grid */}
        <div className="tax-invoice-meta grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2.5 text-[11px] select-text">
          {/* Left: Invoice Metadata */}
          <div className="flex flex-col gap-1 border-r border-slate-200 pr-3">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">GSTIN NO:</span>
              <span className="font-extrabold text-slate-900">{invoiceDetails.gstinNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">HSN CODE:</span>
              <span className="font-semibold text-slate-800">{invoiceDetails.hsnCodeNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">INVOICE NO:</span>
              <span className="font-extrabold text-sky-700">{invoiceDetails.invoiceNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">DATE:</span>
              <span className="font-semibold text-slate-800">{invoiceDetails.invoiceDate || "-"}</span>
            </div>
          </div>

          {/* Right: Customer Metadata */}
          <div className="flex flex-col gap-1 pl-2">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">Customer:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[200px]">{customerDetails.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">Address:</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                {customerDetails.address || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">Contact No:</span>
              <span className="font-semibold text-slate-800">{customerDetails.contactNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[9.5px]">GSTIN NO:</span>
              <span className="font-extrabold text-slate-900">{customerDetails.gstin || "-"}</span>
            </div>
          </div>
        </div>

        {/* 3. Shipment Invoice Table */}
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[230px] border border-slate-300 rounded-lg mb-2 shadow-inner">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold uppercase text-[9px]">
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-[4%] bg-slate-100">S.No</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[9%] bg-slate-100">Date</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[9%] bg-slate-100">DC No</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[14%] bg-slate-100">From</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[14%] bg-slate-100">To</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[15%] bg-slate-100">Payment Company</th>
                <th className="py-1.5 px-1.5 text-left border-r border-slate-300 w-[15%] bg-slate-100">Service Description</th>
                <th className="py-1.5 px-1.5 text-center border-r border-slate-300 w-[5%] bg-slate-100">Qty</th>
                <th className="py-1.5 px-1.5 text-right border-r border-slate-300 w-[8%] bg-slate-100">Rate</th>
                <th className="py-1.5 px-1.5 text-right w-[7%] bg-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400 font-medium italic text-xs">
                    No shipment records resolved for this billing context.
                  </td>
                </tr>
              ) : (
                shipments.map((s, idx) => {
                  const dcNoDisplay = s.customerInvoiceNumber || "-";
                  const fromStr = formatCompanyBranch(s.fromCompany, s.fromAmtBranch);
                  const toStr = formatCompanyBranch(s.toCompany, s.toAmtBranch);
                  const payCompStr = formatPaymentCompany(s);
                  const rateVal = s.pricePerPiece || s.transportRate || 0;
                  const totalVal = s.totalAmount || 0;

                  return (
                    <tr key={s.shipmentId || idx} className="hover:bg-slate-50/50">
                      <td className="py-1 px-1.5 text-center border-r border-slate-200 text-[10px] font-bold text-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-200 text-[10px] font-semibold text-slate-800">
                        {formatDate(s.date, "2-digit")}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-200 text-[10px] font-mono text-slate-800">
                        {dcNoDisplay}
                      </td>
                      <td className="py-1 px-1.5 text-left border-r border-slate-200 text-[10px] font-bold text-slate-800">
                        {fromStr}
                      </td>
                      <td className="py-1 px-1.5 text-left border-r border-slate-200 text-[10px] font-bold text-slate-800">
                        {toStr}
                      </td>
                      <td className="py-1 px-1.5 text-left border-r border-slate-200 text-[10px] font-bold text-slate-800">
                        {payCompStr}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-200 text-[10px] font-medium text-slate-800 truncate max-w-[120px]">
                        {s.packageType || "Transport Freight"}
                      </td>
                      <td className="py-1 px-1.5 text-center border-r border-slate-200 text-[10px] font-bold text-slate-800">
                        {s.quantity || "1"}
                      </td>
                      <td className="py-1 px-1.5 text-right border-r border-slate-200 text-[10px] font-mono text-slate-800">
                        {formatCurrency(rateVal, 2)}
                      </td>
                      <td className="py-1 px-1.5 text-right text-[10px] font-mono font-bold text-slate-900">
                        {formatCurrency(totalVal, 2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Totals Section */}
        <div className="doc-totals-box flex justify-end mb-2.5">
          <div className="w-56 bg-slate-50 p-2 rounded-lg border border-slate-300 flex justify-between items-center text-slate-900 font-extrabold text-xs shadow-2xs">
            <span>Total Amount:</span>
            <span className="font-mono text-sky-700 text-sm font-black">{formatCurrency(subtotal, 2)}</span>
          </div>
        </div>

        {/* 5. Bank Account Details */}
        <div className="doc-bank-details bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2.5 text-[10px] select-text">
          <h3 className="font-black text-[9px] uppercase tracking-wider text-slate-500 mb-1">
            BANK ACCOUNT DETAILS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 font-medium text-slate-700 text-[10px]">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase block">ACCOUNT NAME:</span>
              <span className="font-bold text-slate-900 truncate block">{bankDetails.accountName || "TMS TRANSOS"}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase block">ACCOUNT NUMBER:</span>
              <span className="font-mono font-bold text-slate-900">{bankDetails.accountNumber || "-"}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase block">BANK NAME:</span>
              <span className="font-bold text-slate-900 truncate block">{bankDetails.bankName || "-"}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase block">BRANCH:</span>
              <span className="font-bold text-slate-900 truncate block">{bankDetails.branch || "-"}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase block">IFSC CODE:</span>
              <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode || "-"}</span>
            </div>
          </div>
        </div>

        {/* 6. Signature & Stamp Footer */}
        <div className="doc-footer-block w-full mt-2">
          <div className="border-t border-slate-200 pt-2 flex justify-between items-end text-[9.5px] text-slate-500 font-bold w-full">
            <div className="flex flex-col gap-0.5 text-left">
              <span>Prepared By: System Admin</span>
              <span>TMS Operations Team</span>
            </div>
            <div className="text-right flex flex-col gap-0.5 items-end">
              <div className="h-6 w-28 border-b border-slate-400 mb-0.5" />
              <span>Authorized Signatory</span>
              <span className="text-[8.5px] font-medium text-slate-400">Stamp & Signature Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
