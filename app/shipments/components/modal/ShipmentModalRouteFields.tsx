import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/SearchableSelect";

export interface ShipmentModalRouteFieldsProps {
  formData: ShipmentRecord;
  isEdit: boolean;
  handleFieldChange: (field: keyof ShipmentRecord, value: any) => void;
  branches: Branch[];
  companies: Company[];
}

export default function ShipmentModalRouteFields({
  formData,
  isEdit,
  handleFieldChange,
  branches,
  companies,
}: ShipmentModalRouteFieldsProps) {
  // Filter companies based on active branch selection
  const fromBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === formData?.fromAmtBranch?.trim().toLowerCase()
  );
  const fromAmtCompanies = companies.filter(
    (c) => fromBranchObj && c.branchId === fromBranchObj.branchId
  );

  const toBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === formData?.toAmtBranch?.trim().toLowerCase()
  );
  const toAmtCompanies = companies.filter(
    (c) => toBranchObj && c.branchId === toBranchObj.branchId
  );

  return (
    <>
      {/* From Branch */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">From Branch</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.fromAmtBranch || ""}
            onChange={(val) => handleFieldChange("fromAmtBranch", val)}
            options={branches.map((b) => ({
              value: b.branchName,
              label: b.branchName,
              disabled: b.branchName === formData.toAmtBranch,
              disabledReason: "(Selected in To)",
            }))}
            placeholder="Select origin branch"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.fromAmtBranch}</div>
        )}
      </div>

      {/* From Company */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">From Company</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.fromCompany || ""}
            onChange={(val) => handleFieldChange("fromCompany", val)}
            options={(() => {
              const selectOptions: SearchableSelectOption[] = fromAmtCompanies.map((c) => ({
                value: c.companyName,
                label: c.displayName || c.companyName,
              }));
              const isFromCompanyUnregistered = formData.fromCompany && !fromAmtCompanies.some((c) => c.companyName === formData.fromCompany);
              if (isFromCompanyUnregistered) {
                selectOptions.push({
                  value: formData.fromCompany,
                  label: formData.fromCompany,
                  badge: "Unregistered",
                  badgeType: "shipment" as any,
                });
              }
              return selectOptions;
            })()}
            placeholder="Select sender company"
            allowManualEntry={true}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
            <span>{formData.fromCompany}</span>
            {formData.fromCompany && !fromAmtCompanies.some((c) => c.companyName === formData.fromCompany) && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                ⚠️ Unregistered
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pickup Service */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Pickup Service</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.pickupService || "Branch"}
            onChange={(val) => handleFieldChange("pickupService", val)}
            options={[
              { value: "Branch", label: "Branch" },
              { value: "Home", label: "Home Pickup" },
              { value: "Free Home", label: "Free Pickup" },
            ]}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.pickupService || "Branch"}</div>
        )}
      </div>

      {/* To Branch */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">To Branch</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.toAmtBranch || ""}
            onChange={(val) => handleFieldChange("toAmtBranch", val)}
            options={branches.map((b) => ({
              value: b.branchName,
              label: b.branchName,
              disabled: b.branchName === formData.fromAmtBranch,
              disabledReason: "(Selected in From)",
            }))}
            placeholder="Select destination branch"
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.toAmtBranch}</div>
        )}
      </div>

      {/* To Company */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">To Company</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.toCompany || ""}
            onChange={(val) => handleFieldChange("toCompany", val)}
            options={(() => {
              const selectOptions: SearchableSelectOption[] = toAmtCompanies.map((c) => ({
                value: c.companyName,
                label: c.displayName || c.companyName,
              }));
              const isToCompanyUnregistered = formData.toCompany && !toAmtCompanies.some((c) => c.companyName === formData.toCompany);
              if (isToCompanyUnregistered) {
                selectOptions.push({
                  value: formData.toCompany,
                  label: formData.toCompany,
                  badge: "Unregistered",
                  badgeType: "shipment" as any,
                });
              }
              return selectOptions;
            })()}
            placeholder="Select receiver company"
            allowManualEntry={true}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold flex items-center justify-between gap-1.5">
            <span>{formData.toCompany}</span>
            {formData.toCompany && !toAmtCompanies.some((c) => c.companyName === formData.toCompany) && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/20 shrink-0 select-none">
                ⚠️ Unregistered
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delivery Service */}
      <div>
        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1.5">Delivery Service</label>
        {isEdit ? (
          <SearchableSelect
            value={formData.deliveryService || "Branch"}
            onChange={(val) => handleFieldChange("deliveryService", val)}
            options={[
              { value: "Branch", label: "Branch" },
              { value: "Home", label: "Home Delivery" },
              { value: "Free Home", label: "Free Delivery" },
            ]}
          />
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-300 font-semibold">{formData.deliveryService || "Branch"}</div>
        )}
      </div>
    </>
  );
}
