import React from "react";
import type { ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface ShipmentFiltersProps {
  filters: IFilters;
  onChange: (newFilters: IFilters) => void;
  branches: Branch[];
  onReset: () => void;
  visible: boolean;
  availableYears?: number[];
  packageOptions?: any[];
  onClose?: () => void;
}

export default function ShipmentFilters({
  filters,
  onChange,
  branches,
  onReset,
  visible,
  availableYears = [],
  packageOptions = [],
  onClose,
}: ShipmentFiltersProps) {
  if (!visible) return null;

  const handleFieldChange = (key: keyof IFilters, value: string) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="w-full bg-white dark:bg-[#18191A] border-l-4 border-l-sky-600 dark:border-l-sky-500 border border-slate-200/90 dark:border-zinc-800 p-5 rounded-xl shadow-xs animate-in slide-in-from-top-3 duration-200 select-none">
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-3.5 mb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <svg className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
            Advanced Filters
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-colors"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters })}
            className="bg-[#007acc] hover:bg-[#0062a3] dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-xs"
          >
            Apply Filters
          </button>

          {/* Up Arrow / Close Collapse Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 ml-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs"
              title="Close / Collapse Filters"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Timeframe vs Location & Route */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
        {/* Left Column: Timeframe */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
            Timeframe
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {/* DATE */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">DATE</label>
              <input
                type="date"
                value={filters.date || ""}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs dark:[color-scheme:dark]"
              />
            </div>

            {/* MONTH */}
            <SearchableSelect
              label="MONTH"
              value={filters.month || ""}
              onChange={(val) => handleFieldChange("month", val)}
              placeholder="Select"
              hideSearch
              options={[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ].map((m) => ({ value: m, label: m }))}
            />

            {/* YEAR */}
            <SearchableSelect
              label="YEAR"
              value={filters.year || ""}
              onChange={(val) => handleFieldChange("year", val)}
              placeholder="Select"
              options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* DATE FROM */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">DATE FROM</label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFieldChange("dateFrom", e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs dark:[color-scheme:dark]"
              />
            </div>
            {/* DATE TO */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">DATE TO</label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFieldChange("dateTo", e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Location & Route */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
            Location & Route
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* FROM BRANCH */}
            <SearchableSelect
              label="FROM BRANCH"
              value={filters.fromBranch || ""}
              onChange={(val) => handleFieldChange("fromBranch", val)}
              placeholder="Select origin branch..."
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === filters.toBranch,
                disabledReason: "(Selected in To)",
              }))}
            />
            {/* TO BRANCH */}
            <SearchableSelect
              label="TO BRANCH"
              value={filters.toBranch || ""}
              onChange={(val) => handleFieldChange("toBranch", val)}
              placeholder="Select destination branch..."
              options={branches.map((b) => ({
                value: b.branchName,
                label: b.branchName,
                disabled: b.branchName === filters.fromBranch,
                disabledReason: "(Selected in From)",
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* FROM COMPANY */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">FROM COMPANY</label>
              <input
                type="text"
                placeholder="Origin company"
                value={filters.fromCompany || ""}
                onChange={(e) => handleFieldChange("fromCompany", e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
              />
            </div>
            {/* TO COMPANY */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">TO COMPANY</label>
              <input
                type="text"
                placeholder="Destination company"
                value={filters.toCompany || ""}
                onChange={(e) => handleFieldChange("toCompany", e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Entity Details */}
      <div className="flex flex-col gap-3 mb-5">
        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
          Entity Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VEHICLE NO. */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">VEHICLE NO.</label>
            <input
              type="text"
              placeholder="E.G. TRK-492"
              value={filters.vehicleNumber || ""}
              onChange={(e) => handleFieldChange("vehicleNumber", e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          </div>
          {/* PACKAGE TYPE */}
          <SearchableSelect
            label="PACKAGE TYPE"
            value={filters.packageType || ""}
            onChange={(val) => handleFieldChange("packageType", val)}
            placeholder="All Package Types"
            options={packageOptions}
          />
          {/* OUR INVOICE NO. */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">OUR INVOICE NO.</label>
            <input
              type="text"
              placeholder="INV-00000"
              value={filters.ourInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("ourInvoiceNumber", e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          </div>
          {/* CUSTOMER INVOICE NO. */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">CUSTOMER INVOICE NO.</label>
            <input
              type="text"
              placeholder="Reference No."
              value={filters.customerInvoiceNumber || ""}
              onChange={(e) => handleFieldChange("customerInvoiceNumber", e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Status & Services */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80">
          Status & Services
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DELIVERY STATUS */}
          <SearchableSelect
            label="DELIVERY STATUS"
            value={filters.deliveryStatus || ""}
            onChange={(val) => handleFieldChange("deliveryStatus", val)}
            placeholder="All Statuses"
            hideSearch
            options={[
              { value: "Not Delivered", label: "Not Delivered" },
              { value: "Delivered", label: "Delivered" },
              { value: "Missing", label: "Missing" },
              { value: "Damaged", label: "Damaged" },
            ]}
          />

          {/* PAYMENT STATUS */}
          <SearchableSelect
            label="PAYMENT STATUS"
            value={filters.paymentStatus || ""}
            onChange={(val) => handleFieldChange("paymentStatus", val)}
            placeholder="All Statuses"
            hideSearch
            options={[
              { value: "Pending", label: "Pending" },
              { value: "Paid", label: "Paid" },
              { value: "Free", label: "Free" },
            ]}
          />

          {/* PICKUP SERVICE */}
          <SearchableSelect
            label="PICKUP SERVICE"
            value={filters.pickupService || ""}
            onChange={(val) => handleFieldChange("pickupService", val)}
            placeholder="Any"
            hideSearch
            options={[
              { value: "Branch", label: "Branch" },
              { value: "Home", label: "Home Pickup" },
              { value: "Free Home", label: "Free Pickup" },
            ]}
          />

          {/* DELIVERY SERVICE */}
          <SearchableSelect
            label="DELIVERY SERVICE"
            value={filters.deliveryService || ""}
            onChange={(val) => handleFieldChange("deliveryService", val)}
            placeholder="Any"
            hideSearch
            options={[
              { value: "Branch", label: "Branch" },
              { value: "Home", label: "Home Delivery" },
              { value: "Free Home", label: "Free Delivery" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
