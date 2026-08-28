import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import { PAYMENT_STATUS_OPTIONS, DELIVERY_STATUS_OPTIONS } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { buildPaymentCompanyOptions, getPaymentCompanyDisplayText } from "../../utils/paymentCompanyOptions";

export interface ShipmentModalPaymentInvoiceFieldsProps {
  formData: ShipmentRecord;
  isEdit: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
  branches: Branch[];
  companies: Company[];
}

export default function ShipmentModalPaymentInvoiceFields({
  formData,
  isEdit,
  handleFieldChange,
  branches,
  companies,
}: ShipmentModalPaymentInvoiceFieldsProps) {
  const payCompanyDisplayText = getPaymentCompanyDisplayText({
    paymentCompany: formData.paymentCompany,
    paymentReceivingBranch: formData.paymentReceivingBranch,
    fromAmtBranch: formData.fromAmtBranch,
    toAmtBranch: formData.toAmtBranch,
    branches,
    companies,
  });

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Row 1: Delivery Status & Payment Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Delivery Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Delivery Status</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.deliveryStatus || "Not Delivered"}
              onChange={(val) => handleFieldChange("deliveryStatus", val)}
              options={DELIVERY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
            />
          ) : (
            <div className="min-h-[36px] flex items-center">
              <span className="bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wide w-full text-center block border border-slate-300/60 dark:border-zinc-700/60">
                {formData.deliveryStatus || "Not Delivered"}
              </span>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Payment Status</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentStatus || "Pending"}
              onChange={(val) => handleFieldChange("paymentStatus", val)}
              options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              hideClearOption
            />
          ) : (
            <div className="min-h-[36px] flex items-center">
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wide w-full text-center block border border-amber-300/80 dark:border-amber-700/80">
                {formData.paymentStatus || "Pending"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Our Invoice & Cust Invoice */}
      <div className="grid grid-cols-2 gap-3">
        {/* Our Invoice Number */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Our Invoice No.</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.ourInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("ourInvoiceNumber", e.target.value)}
              placeholder="e.g. 78"
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center justify-center">
              {formData.ourInvoiceNumber || "-"}
            </div>
          )}
        </div>

        {/* Customer Invoice Number */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Cust Invoice No.</label>
          {isEdit ? (
            <input
              type="text"
              value={formData.customerInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("customerInvoiceNumber", e.target.value)}
              placeholder="e.g. 456"
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center justify-center">
              {formData.customerInvoiceNumber || "-"}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Payment Branch & Payment Company */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payment Branch */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Payment Branch</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentReceivingBranch || ""}
              onChange={(val) => handleFieldChange("paymentReceivingBranch", val)}
              options={[
                { value: "From Company", label: "From Branch" },
                { value: "To Company", label: "To Branch" },
              ]}
              placeholder="Select..."
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center">
              {formData.paymentReceivingBranch === "From Company"
                ? "From Branch"
                : formData.paymentReceivingBranch === "To Company"
                ? "To Branch"
                : "-"}
            </div>
          )}
        </div>

        {/* Payment Company */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Payment Company</label>
          {isEdit ? (
            <SearchableSelect
              value={formData.paymentCompany || ""}
              onChange={(val) => handleFieldChange("paymentCompany", val)}
              options={buildPaymentCompanyOptions({
                paymentReceivingBranch: formData.paymentReceivingBranch,
                fromAmtBranch: formData.fromAmtBranch,
                toAmtBranch: formData.toAmtBranch,
                fromCompany: formData.fromCompany,
                toCompany: formData.toCompany,
                currentPaymentCompany: formData.paymentCompany,
                branches,
                companies,
              })}
              placeholder="Select payment company"
              allowManualEntry={true}
              manualEntryPosition="top"
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center truncate">
              {payCompanyDisplayText || "-"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
