import { useState, useCallback, useEffect } from "react";
import type { ShipmentRecord, WorkspaceContext, ShipmentFilters as IFilters } from "@/types/shipment";

export interface UseDashboardKPIsParams {
  context: WorkspaceContext;
  resolvedBaseName: string;
  filters?: Partial<IFilters>;
}

export interface UseDashboardKPIsReturn {
  dashboardShipments: ShipmentRecord[];
  setDashboardShipments: React.Dispatch<React.SetStateAction<ShipmentRecord[]>>;
  dashboardLoading: boolean;
  setDashboardLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchDashboardKPIs: () => Promise<void>;
}

export function useDashboardKPIs({
  context,
  resolvedBaseName,
  filters,
}: UseDashboardKPIsParams): UseDashboardKPIsReturn {
  const [dashboardShipments, setDashboardShipments] = useState<ShipmentRecord[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);

  const month = filters?.month;
  const year = filters?.year;

  // Fetch all shipments matching base context for Dashboard KPIs
  const fetchDashboardKPIs = useCallback(async () => {
    if (context.type === "global" || !resolvedBaseName) return;
    setDashboardLoading(true);
    try {
      const params = new URLSearchParams();
      if (context.type === "branch") {
        params.append("fromBranch", resolvedBaseName);
      } else if (context.type === "company") {
        params.append("company", resolvedBaseName);
      }
      if (month) params.append("month", month);
      if (year) params.append("year", year);

      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDashboardShipments(json.data);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard KPIs:", err);
    } finally {
      setDashboardLoading(false);
    }
  }, [context, resolvedBaseName, month, year]);

  // Automatically fetch KPIs when context, base name, month, or year changes
  useEffect(() => {
    fetchDashboardKPIs();
  }, [fetchDashboardKPIs]);

  return {
    dashboardShipments,
    setDashboardShipments,
    dashboardLoading,
    setDashboardLoading,
    fetchDashboardKPIs,
  };
}
