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
        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1.5">Date</label>
        {isEdit ? (
          <input
            type="date"
            value={formData.date || ""}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.date}</div>
        )}
      </div>

      {/* Vehicle */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Vehicle Number</label>
        {isEdit ? (
          <input
            type="text"
            value={formData.vehicleNumber || ""}
            onChange={(e) => handleFieldChange("vehicleNumber", e.target.value)}
            placeholder="e.g. MH-12-AB-1234"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500 outline-none"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.vehicleNumber}</div>
        )}
      </div>

      {/* Package */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Package Type</label>
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
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
            <span>{formData.packageType}</span>
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
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                    ⚠️ Unregistered
                  </span>
                );
              }
              if (badgeStatus === "no-rate") {
                return (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                    ⚠️ No Rate
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
