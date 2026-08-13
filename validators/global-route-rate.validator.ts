import type { GlobalRouteRate } from "@/types/global-route-rate";

export function validateGlobalRouteRate(
  rateData: Omit<GlobalRouteRate, "routeRateId" | "createdAt" | "updatedAt">
): void {
  if (!rateData.fromBranchId?.trim()) {
    throw new Error("From Branch ID is required.");
  }

  if (!rateData.toBranchId?.trim()) {
    throw new Error("To Branch ID is required.");
  }

  if (rateData.fromBranchId.trim() === rateData.toBranchId.trim()) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  if (!rateData.packageId?.trim()) {
    throw new Error("Package ID is required.");
  }

  if (typeof rateData.rate !== "number" || isNaN(rateData.rate) || rateData.rate <= 0) {
    throw new Error("Rate must be greater than 0.");
  }

  if (!["Active", "Inactive"].includes(rateData.status)) {
    throw new Error("Status must be either Active or Inactive.");
  }
}
