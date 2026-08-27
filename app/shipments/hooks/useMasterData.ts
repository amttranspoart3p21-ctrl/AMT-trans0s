import { useState, useEffect, useRef, useCallback } from "react";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import type { WorkspaceContext, ShipmentFilters as IFilters } from "@/types/shipment";

export interface UseMasterDataParams {
  context: WorkspaceContext;
  onContextResolved?: (filterUpdate: Partial<IFilters>) => void;
}

export interface UseMasterDataReturn {
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates: CompanyRouteRate[];
  globalRouteRates: GlobalRouteRate[];
  availableYears: number[];
  shipmentPackages: string[];
  resolvedBaseName: string;
  hasInitializedFilters: React.MutableRefObject<boolean>;
  fetchYears: () => Promise<void>;
  fetchShipmentPackages: (filters?: Partial<IFilters>) => Promise<void>;
}

export function useMasterData({
  context,
  onContextResolved,
}: UseMasterDataParams): UseMasterDataReturn {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [companyRouteRates, setCompanyRouteRates] = useState<CompanyRouteRate[]>([]);
  const [globalRouteRates, setGlobalRouteRates] = useState<GlobalRouteRate[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [shipmentPackages, setShipmentPackages] = useState<string[]>([]);
  const [resolvedBaseName, setResolvedBaseName] = useState<string>("");

  const hasInitializedFilters = useRef<boolean>(false);

  // Fetch branches and all active master data objects on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [branchRes, compRes, pkgRes, crrRes, grrRes, yearRes] = await Promise.all([
          fetch("/api/branches?status=Active"),
          fetch("/api/companies?status=Active"),
          fetch("/api/packages?status=Active"),
          fetch("/api/company-route-rates?status=Active"),
          fetch("/api/global-route-rates?status=Active"),
          fetch("/api/shipments/years"),
        ]);

        if (branchRes.ok) {
          const json = await branchRes.json();
          if (json.success && Array.isArray(json.data)) setBranches(json.data);
        }
        if (compRes.ok) {
          const json = await compRes.json();
          if (json.companies) setCompanies(json.companies);
        }
        if (pkgRes.ok) {
          const json = await pkgRes.json();
          if (json.packages) setPackages(json.packages);
        }
        if (crrRes.ok) {
          const json = await crrRes.json();
          if (json.companyRouteRates) setCompanyRouteRates(json.companyRouteRates);
        }
        if (grrRes.ok) {
          const json = await grrRes.json();
          if (json.routeRates) setGlobalRouteRates(json.routeRates);
        }
        if (yearRes.ok) {
          const json = await yearRes.json();
          if (json.success && Array.isArray(json.years)) setAvailableYears(json.years);
        }
      } catch (err) {
        console.error("Error loading master database:", err);
      }
    };
    fetchMasterData();
  }, []);

  // Resolve base filter name from dynamic workspaceId only ONCE on first load
  useEffect(() => {
    if (context.type === "global") {
      setResolvedBaseName("");
      return;
    }
    if (hasInitializedFilters.current) return;

    if (context.type === "branch" && branches.length > 0 && context.id) {
      const b = branches.find((item) => item.branchId === context.id);
      if (b) {
        setResolvedBaseName(b.branchName);
        onContextResolved?.({ fromBranch: b.branchName });
        hasInitializedFilters.current = true;
      }
    }
    if (context.type === "company" && companies.length > 0 && context.id) {
      const c = companies.find((item) => item.companyId === context.id);
      if (c) {
        setResolvedBaseName(c.companyName);
        onContextResolved?.({ company: c.companyName });
        hasInitializedFilters.current = true;
      }
    }
  }, [context, branches, companies, onContextResolved]);

  const fetchShipmentPackages = useCallback(async (filters?: Partial<IFilters>) => {
    try {
      const params = new URLSearchParams();
      if (filters?.month) params.append("month", filters.month);
      if (filters?.year) params.append("year", filters.year);
      if (filters?.fromBranch) params.append("fromBranch", filters.fromBranch);
      if (filters?.toBranch) params.append("toBranch", filters.toBranch);
      if (filters?.company) params.append("company", filters.company);

      const res = await fetch(`/api/shipments/packages?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.packages)) {
          setShipmentPackages(json.packages);
        }
      }
    } catch (err) {
      console.error("Error loading shipment packages:", err);
    }
  }, []);

  const fetchYears = useCallback(async () => {
    try {
      const res = await fetch("/api/shipments/years");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.years)) {
          setAvailableYears(json.years);
        }
      }
    } catch (err) {
      console.error("Error loading years dynamically:", err);
    }
  }, []);

  return {
    branches,
    companies,
    packages,
    companyRouteRates,
    globalRouteRates,
    availableYears,
    shipmentPackages,
    resolvedBaseName,
    hasInitializedFilters,
    fetchYears,
    fetchShipmentPackages,
  };
}
