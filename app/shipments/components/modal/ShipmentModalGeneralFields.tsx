import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { buildPackageOptionsList, getPackageBadgeStatus } from "@/utils/package-filter";

export interface ShipmentModalGeneralFieldsProps {
  formData: ShipmentRecord;
  isEdit: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates?: CompanyRouteRate[];
  globalRouteRates?: GlobalRouteRate[];
}

export default function ShipmentModalGeneralFields({
  formData,
  isEdit,
  handleFieldChange,
  branches,
  companies,
  packages,
  companyRouteRates = [],
  globalRouteRates = [],
}: ShipmentModalGeneralFieldsProps) {
  return (
    <>
      {/* Date */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Date</label>
        {isEdit ? (
          <input
            type="date"
            value={formData.date || ""}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs dark:[color-scheme:dark]"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center">
            {formData.date || "-"}
          </div>
        )}
      </div>

      {/* Vehicle */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Number</label>
        {isEdit ? (
          <input
            type="text"
            value={formData.vehicleNumber || ""}
            onChange={(e) => handleFieldChange("vehicleNumber", e.target.value)}
            placeholder="e.g. TN-00-HV-9087"
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 dark:focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center">
            {formData.vehicleNumber || "-"}
          </div>
        )}
      </div>

      {/* Package */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Package Type</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.packageType || ""}
            onChange={(val) => handleFieldChange("packageType", val)}
            options={buildPackageOptionsList(
              formData.packageType,
              formData.fromAmtBranch,
              formData.toAmtBranch,
              formData.paymentCompany,
              companyRouteRates,
              globalRouteRates,
              companies,
              branches,
              packages,
              formData.paymentReceivingBranch
            )}
            noResultsText="No packages configured for this route."
            placeholder="Select package type"
            allowManualEntry={true}
            manualEntryLabel="Package Type"
            manualEntryPlaceholder="Enter manual package type..."
            manualEntryButtonText="Enter Package Manually"
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-100 shadow-2xs min-h-[36px] flex items-center justify-between gap-1.5">
            <span>{formData.packageType || "-"}</span>
            {(() => {
              const badgeStatus = getPackageBadgeStatus(
                formData.packageType,
                formData.fromAmtBranch,
                formData.toAmtBranch,
                formData.paymentCompany,
                companyRouteRates,
                globalRouteRates,
                companies,
                branches,
                packages,
                formData.paymentReceivingBranch
              );
              if (badgeStatus === "unregistered") {
                return (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 select-none flex items-center gap-1">
                    ⚠️ UNREGISTERED
                  </span>
                );
              }
              if (badgeStatus === "no-rate") {
                return (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 select-none flex items-center gap-1">
                    ⚠️ NO RATE
                  </span>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </>
  );
}
