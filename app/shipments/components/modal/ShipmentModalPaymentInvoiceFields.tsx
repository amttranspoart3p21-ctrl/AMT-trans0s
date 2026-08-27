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
  return (
    <>
      {/* Payment Branch */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Branch Type</label>
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
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">
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
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Company</label>
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
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">
            {getPaymentCompanyDisplayText({
              paymentCompany: formData.paymentCompany,
              paymentReceivingBranch: formData.paymentReceivingBranch,
              fromAmtBranch: formData.fromAmtBranch,
              toAmtBranch: formData.toAmtBranch,
              branches,
              companies,
            })}
          </div>
        )}
      </div>

      {/* Payment Status */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Payment Status</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.paymentStatus || "Pending"}
            onChange={(val) => handleFieldChange("paymentStatus", val)}
            options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            hideClearOption
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.paymentStatus}</div>
        )}
      </div>

      {/* Delivery Status */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Status</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.deliveryStatus || "Not Delivered"}
            onChange={(val) => handleFieldChange("deliveryStatus", val)}
            options={DELIVERY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            hideClearOption
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.deliveryStatus}</div>
        )}
      </div>

      {/* Our Invoice Number */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Our Invoice Number</label>
        {isEdit ? (
          <input
            type="text"
            value={formData.ourInvoiceNumber || ""}
            onChange={(e) => handleFieldChange("ourInvoiceNumber", e.target.value)}
            placeholder="e.g. INV-001"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.ourInvoiceNumber || "—"}</div>
        )}
      </div>

      {/* Customer Invoice Number */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Customer Invoice Number</label>
        {isEdit ? (
          <input
            type="text"
            value={formData.customerInvoiceNumber || ""}
            onChange={(e) => handleFieldChange("customerInvoiceNumber", e.target.value)}
            placeholder="e.g. CUST-INV-100"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.customerInvoiceNumber || "—"}</div>
        )}
      </div>
    </>
  );
}
