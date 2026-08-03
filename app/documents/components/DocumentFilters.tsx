import React from "react";
import ShipmentFilters from "@/app/shipments/components/ShipmentFilters";
import type { ShipmentFilters as IFilters } from "@/types/shipment";
import type { Branch } from "@/types/branch";

interface DocumentFiltersProps {
  filters: IFilters;
  onChange: (filters: IFilters) => void;
  branches: Branch[];
  onReset: () => void;
  visible: boolean;
}

export default function DocumentFilters({
  filters,
  onChange,
  branches,
  onReset,
  visible,
}: DocumentFiltersProps) {
  return (
    <div className="w-full">
      <ShipmentFilters
        filters={filters}
        onChange={onChange}
        branches={branches}
        onReset={onReset}
        visible={visible}
      />
    </div>
  );
}
