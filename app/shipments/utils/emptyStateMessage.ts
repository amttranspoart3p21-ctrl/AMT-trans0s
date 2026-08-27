import type { ShipmentFilters as IFilters } from "@/types/shipment";

export function getEmptyStateMessage(filters: Partial<IFilters>): string {
  if (filters.month || filters.year) {
    const mStr = filters.month || "";
    const yStr = filters.year || "";
    if (mStr && yStr) {
      return `No shipments found for ${mStr} ${yStr}.`;
    } else if (mStr) {
      return `No shipments found for ${mStr}.`;
    } else if (yStr) {
      return `No shipments found for Year ${yStr}.`;
    }
  }
  return "No shipments found";
}
