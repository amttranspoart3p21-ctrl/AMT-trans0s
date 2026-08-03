import React from "react";
import type { ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";

interface ShipmentFiltersProps {
  filters: IFilters;
  onChange: (newFilters: IFilters) => void;
  branches: Branch[];
  onReset: () => void;
  visible: boolean;
}

export default function ShipmentFilters({
  filters,
  onChange,
  branches,
  onReset,
  visible,
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
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">From Branch</label>
          <select
            value={filters.fromBranch || ""}
            onChange={(e) => handleFieldChange("fromBranch", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Origin Branches</option>
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchName} disabled={b.branchName === filters.toBranch}>
                {b.branchName} {b.branchName === filters.toBranch ? "(Selected in To)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* To Branch Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">To Branch</label>
          <select
            value={filters.toBranch || ""}
            onChange={(e) => handleFieldChange("toBranch", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all cursor-pointer"
          >
            <option value="" className="text-slate-500">All Destination Branches</option>
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchName} disabled={b.branchName === filters.fromBranch}>
                {b.branchName} {b.branchName === filters.fromBranch ? "(Selected in From)" : ""}
              </option>
            ))}
          </select>
        </div>

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
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Package Type</label>
          <input
            type="text"
            placeholder="e.g. Box, Roll"
            value={filters.packageType || ""}
            onChange={(e) => handleFieldChange("packageType", e.target.value)}
            className="w-full bg-slate-955/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-650 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all"
          />
        </div>

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
