import React, { useState, useEffect, useRef } from "react";
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
}

const YearDropdown = ({
  value,
  onChange,
  years,
}: {
  value: string;
  onChange: (val: string) => void;
  years: number[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredYears = years.filter((y) =>
    String(y).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex flex-col" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5 font-semibold">Year</label>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer flex justify-between items-center text-left"
      >
        <span>{value ? value : "All Years"}</span>
        <svg
          className={`h-3 w-3 text-slate-455 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search year..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 mb-2"
            autoFocus
          />
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-350 hover:text-slate-100 transition-colors"
            >
              All Years
            </button>
            {filteredYears.length > 0 ? (
              filteredYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(String(y));
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition-colors ${
                    value === String(y)
                      ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                      : "text-slate-350 hover:text-slate-100"
                  }`}
                >
                  {y}
                </button>
              ))
            ) : (
              <div className="text-[10px] text-slate-550 text-center py-2">No years found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ShipmentFilters({
  filters,
  onChange,
  branches,
  onReset,
  visible,
  availableYears = [],
  packageOptions = [],
}: ShipmentFiltersProps) {
  if (!visible) return null;

  const handleFieldChange = (key: keyof IFilters, value: string) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-850 p-5 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Date Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Date</label>
          <input
            type="date"
            value={filters.date || ""}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Month Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Month</label>
          <select
            value={filters.month || ""}
            onChange={(e) => handleFieldChange("month", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Months</option>
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <YearDropdown
          value={filters.year || ""}
          onChange={(val) => handleFieldChange("year", val)}
          years={availableYears}
        />

        {/* Date From Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Date From</label>
          <input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => handleFieldChange("dateFrom", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Date To Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Date To</label>
          <input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => handleFieldChange("dateTo", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* From Branch Filter */}
        <SearchableSelect
          label="From Branch"
          value={filters.fromBranch || ""}
          onChange={(val) => handleFieldChange("fromBranch", val)}
          placeholder="All Origin Branches"
          options={branches.map((b) => ({
            value: b.branchName,
            label: b.branchName,
            disabled: b.branchName === filters.toBranch,
            disabledReason: "(Selected in To)",
          }))}
        />

        {/* To Branch Filter */}
        <SearchableSelect
          label="To Branch"
          value={filters.toBranch || ""}
          onChange={(val) => handleFieldChange("toBranch", val)}
          placeholder="All Destination Branches"
          options={branches.map((b) => ({
            value: b.branchName,
            label: b.branchName,
            disabled: b.branchName === filters.fromBranch,
            disabledReason: "(Selected in From)",
          }))}
        />

        {/* Vehicle Number Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Vehicle Number</label>
          <input
            type="text"
            placeholder="e.g. TN23 L4495"
            value={filters.vehicleNumber || ""}
            onChange={(e) => handleFieldChange("vehicleNumber", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* From Company Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">From Company</label>
          <input
            type="text"
            placeholder="e.g. Ambur Leather"
            value={filters.fromCompany || ""}
            onChange={(e) => handleFieldChange("fromCompany", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* To Company Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">To Company</label>
          <input
            type="text"
            placeholder="e.g. Chennai Warehouse"
            value={filters.toCompany || ""}
            onChange={(e) => handleFieldChange("toCompany", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Package Type Filter */}
        <SearchableSelect
          label="Package Type"
          value={filters.packageType || ""}
          onChange={(val) => handleFieldChange("packageType", val)}
          placeholder="All Package Types"
          options={packageOptions}
        />

        {/* Our Company Invoice */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Our Invoice Number</label>
          <input
            type="text"
            placeholder="e.g. TX-49502"
            value={filters.ourInvoiceNumber || ""}
            onChange={(e) => handleFieldChange("ourInvoiceNumber", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Customer Invoice */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Customer Invoice Number</label>
          <input
            type="text"
            placeholder="e.g. INV-10920"
            value={filters.customerInvoiceNumber || ""}
            onChange={(e) => handleFieldChange("customerInvoiceNumber", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Delivery Status Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Delivery Status</label>
          <select
            value={filters.deliveryStatus || ""}
            onChange={(e) => handleFieldChange("deliveryStatus", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Delivery Statuses</option>
            <option value="Not Delivered">Not Delivered</option>
            <option value="Delivered">Delivered</option>
            <option value="Missing">Missing</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Payment Status</label>
          <select
            value={filters.paymentStatus || ""}
            onChange={(e) => handleFieldChange("paymentStatus", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Payment Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Free">Free</option>
          </select>
        </div>

        {/* Pickup Service Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Pickup Service</label>
          <select
            value={filters.pickupService || ""}
            onChange={(e) => handleFieldChange("pickupService", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Pickup Services</option>
            <option value="Branch">Branch</option>
            <option value="Home">Home</option>
            <option value="Free Home">Free Home</option>
          </select>
        </div>

        {/* Delivery Service Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Delivery Service</label>
          <select
            value={filters.deliveryService || ""}
            onChange={(e) => handleFieldChange("deliveryService", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Delivery Services</option>
            <option value="Branch">Branch</option>
            <option value="Home">Home</option>
            <option value="Free Home">Free Home</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-850/60">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-700/50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
          </svg>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
