"use client";

import React, { useState, useEffect } from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import { getCompanySettings, DEFAULT_COMPANY_SETTINGS, type CompanySettings } from "@/utils/settings";

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
  // Resolve branch codes cleanly for display
  const resolveBranchCode = (val: string): string => {
    if (!val) return "-";
    const clean = val.trim();
    if (!clean) return "-";
    const match = branches.find(
      (b) =>
        b.branchCode.toLowerCase() === clean.toLowerCase() ||
        b.branchName.toLowerCase() === clean.toLowerCase() ||
        b.branchId.toLowerCase() === clean.toLowerCase()
    );
    return match ? match.branchCode : clean;
  };

  const formatCompanyBranch = (company: string | undefined, branchVal: string | undefined): string => {
    const comp = (company || "").trim();
    const bCode = resolveBranchCode(branchVal || "");
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

    const bCode = resolveBranchCode(branchVal);
    const branchStr = bCode && bCode !== "-" ? bCode : branchVal;

    if (comp && branchStr) {
      return `${comp} - ${branchStr}`;
    }
    return comp || branchStr || "-";
  };

  // Total amount calculation from filtered shipments
  const subtotal = shipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const formatDate = (val: string): string => {
    if (!val) return "-";
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });
      }
    } catch (_) {}
    return val;
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="w-full doc-layout-outer bg-slate-950 p-4 md:p-6 flex justify-center overflow-x-auto select-text">
      <div
        id="printable-document"
        className="tax-invoice-document w-full max-w-[1000px] bg-white text-slate-900 shadow-2xl rounded-xl p-8 flex flex-col justify-between relative border border-slate-200"
      >
        {/* Top Header Branding */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            {/* Company info (left/center) */}
            <div className="flex-1 text-center">
              <h2 className="text-xl font-extrabold uppercase text-violet-950 mt-1">
                {settings.companyName || DEFAULT_COMPANY_SETTINGS.companyName}
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                Transport Management System
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {settings.address || DEFAULT_COMPANY_SETTINGS.address}
              </p>
              <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                {phoneDisplay && `Phone: ${phoneDisplay}`}
                {phoneDisplay && settings.email && " | "}
                {settings.email && `Email: ${settings.email}`}
              </p>
            </div>
            {/* Logo (right) */}
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Company Logo"
                className="h-16 w-16 object-contain rounded-lg shrink-0 border border-slate-200"
              />
            ) : (
              <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center shrink-0 text-slate-400 font-bold text-[10px] tracking-wider select-none bg-slate-50">
                LOGO
              </div>
            )}
          </div>
        </div>

        {/* Invoice & Customer Details Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs select-text">
          {/* Left: Invoice Metadata */}
          <div className="flex flex-col gap-1.5 border-r border-slate-250 pr-4">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">GSTIN NO:</span>
              <span className="font-extrabold text-slate-900">{invoiceDetails.gstinNo || "33AABCA1234F1Z5"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">HSN CODE NO:</span>
              <span className="font-bold text-slate-800">{invoiceDetails.hsnCodeNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Invoice No:</span>
              <span className="font-extrabold text-violet-700">{invoiceDetails.invoiceNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Invoice Date:</span>
              <span className="font-bold text-slate-800">{invoiceDetails.invoiceDate || "-"}</span>
            </div>
          </div>

          {/* Right: Billed Customer Info */}
          <div className="flex flex-col gap-1.5 pl-2">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Billed To (Name):</span>
              <span className="font-extrabold text-slate-900">{customerDetails.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Address:</span>
              <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                {customerDetails.address || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Contact No:</span>
              <span className="font-semibold text-slate-800">{customerDetails.contactNo || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500 uppercase text-[10px]">GSTIN NO:</span>
              <span className="font-extrabold text-slate-900">{customerDetails.gstin || "-"}</span>
            </div>
          </div>
        </div>

        {/* Shipment Invoice Table */}
        <div className="w-full overflow-hidden border border-slate-300 rounded-lg mb-6">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-[4%]">S.No</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[9%]">Date</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[9%]">DC No</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[14%]">From</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[14%]">To</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[15%]">Payment Company</th>
                <th className="py-2.5 px-2 text-left border-r border-slate-300 w-[15%]">Service Description</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-[5%]">Qty</th>
                <th className="py-2.5 px-2 text-right border-r border-slate-300 w-[8%]">Rate</th>
                <th className="py-2.5 px-2 text-right w-[7%]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium italic">
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
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-[11px] font-bold text-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-[10.5px] font-semibold text-slate-800">
                        {formatDate(s.date)}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-[10.5px] font-mono text-slate-800">
                        {dcNoDisplay}
                      </td>
                      <td className="py-2 px-2 text-left border-r border-slate-200 text-[10.5px] font-bold text-slate-800">
                        {fromStr}
                      </td>
                      <td className="py-2 px-2 text-left border-r border-slate-200 text-[10.5px] font-bold text-slate-800">
                        {toStr}
                      </td>
                      <td className="py-2 px-2 text-left border-r border-slate-200 text-[10.5px] font-bold text-slate-800">
                        {payCompStr}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-[10.5px] font-medium text-slate-800 truncate">
                        {s.packageType || "Transport Freight"}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200 text-[10.5px] font-bold text-slate-800">
                        {s.quantity || "1"}
                      </td>
                      <td className="py-2 px-2 text-right border-r border-slate-200 text-[10.5px] font-mono text-slate-800">
                        {formatCurrency(rateVal)}
                      </td>
                      <td className="py-2 px-2 text-right text-[10.5px] font-mono font-bold text-slate-900">
                        {formatCurrency(totalVal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-6">
          <div className="w-64 bg-slate-50 p-3 rounded-lg border border-slate-300 flex justify-between items-center text-slate-900 font-extrabold text-sm">
            <span>Total Amount:</span>
            <span className="font-mono text-violet-700">{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-xs select-text">
          <h3 className="font-black text-[10px] uppercase tracking-wider text-slate-500 mb-2">
            BANK ACCOUNT DETAILS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-medium text-slate-700 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ACCOUNT NAME:</span>
              <span className="font-bold text-slate-900">{bankDetails.accountName || "TMS TRANSOS"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ACCOUNT NUMBER:</span>
              <span className="font-mono font-bold text-slate-900">{bankDetails.accountNumber || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">BANK NAME:</span>
              <span className="font-bold text-slate-900">{bankDetails.bankName || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">BRANCH:</span>
              <span className="font-bold text-slate-900">{bankDetails.branch || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC CODE:</span>
              <span className="font-mono font-bold text-slate-900">{bankDetails.ifscCode || "-"}</span>
            </div>
          </div>
        </div>

        {/* Signature & Stamp Footer */}
        <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-[10px] text-slate-500 font-bold">
          <div className="flex flex-col gap-0.5">
            <span>Prepared By: System Admin</span>
            <span>TMS Operations Team</span>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
            <div className="h-10 w-28 border-b border-slate-400 mb-1" />
            <span>Authorized Signatory</span>
            <span className="text-[9px] font-medium text-slate-400">Stamp & Signature Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
