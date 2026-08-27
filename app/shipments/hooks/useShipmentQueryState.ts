import { useState, useEffect } from "react";
import type { ShipmentFilters as IFilters, WorkspaceContext } from "@/types/shipment";

export interface UseShipmentQueryStateParams {
  defaultFilters?: Partial<IFilters>;
  context: WorkspaceContext;
  resolvedBaseName: string;
}

export interface UseShipmentQueryStateReturn {
  // Filters & Search
  filters: IFilters;
  setFilters: React.Dispatch<React.SetStateAction<IFilters>>;
  searchText: string;
  setSearchText: React.Dispatch<React.SetStateAction<string>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCount: number;
  handleFilterChange: (newFilters: IFilters) => void;
  handleResetFilters: () => void;

  // Sorting
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  handleSort: (columnKey: string) => void;

  // Pagination
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  setTotalPages: React.Dispatch<React.SetStateAction<number>>;
  totalRecords: number;
  setTotalRecords: React.Dispatch<React.SetStateAction<number>>;
  handleLimitChange: (newLimit: number) => void;
}

export function useShipmentQueryState({
  defaultFilters = {},
  context,
  resolvedBaseName,
}: UseShipmentQueryStateParams): UseShipmentQueryStateReturn {
  // Search & Filter UI toggle
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Search Input State (with local search debounce)
  const [searchText, setSearchText] = useState<string>("");

  // Filters State
  const [filters, setFilters] = useState<IFilters>({
    search: undefined,
    date: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    fromBranch: undefined,
    toBranch: undefined,
    deliveryStatus: undefined,
    paymentStatus: undefined,
    vehicleNumber: undefined,
    fromCompany: undefined,
    toCompany: undefined,
    company: undefined,
    packageType: undefined,
    pickupService: undefined,
    deliveryService: undefined,
    ourInvoiceNumber: undefined,
    customerInvoiceNumber: undefined,
    ...defaultFilters,
  });

  // Sorting States
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination States
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Debounced search text observer
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchText.trim() || undefined,
      }));
      setPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  // Sorting Handler
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Limit change handler
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Filter change handler
  const handleFilterChange = (newFilters: IFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchText("");
    const resetVals: IFilters = {
      search: undefined,
      date: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      fromBranch: undefined,
      toBranch: undefined,
      deliveryStatus: undefined,
      paymentStatus: undefined,
      vehicleNumber: undefined,
      fromCompany: undefined,
      toCompany: undefined,
      company: undefined,
      packageType: undefined,
      pickupService: undefined,
      deliveryService: undefined,
      ourInvoiceNumber: undefined,
      customerInvoiceNumber: undefined,
      ...defaultFilters, // Re-lock default base context filters if passed explicitly
    };
    // Re-lock base context initial values
    if (context.type === "branch") {
      resetVals.fromBranch = resolvedBaseName;
    } else if (context.type === "company") {
      resetVals.company = resolvedBaseName;
    }
    setFilters(resetVals);
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    filters,
    setFilters,
    searchText,
    setSearchText,
    showFilters,
    setShowFilters,
    activeFilterCount,
    handleFilterChange,
    handleResetFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleSort,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    setTotalPages,
    totalRecords,
    setTotalRecords,
    handleLimitChange,
  };
}
