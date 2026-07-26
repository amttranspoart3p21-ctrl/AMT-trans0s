import type { CompanyRouteRate } from "@/types/company-route-rate";

export function validateCompanyRouteRate(
  rateData: Omit<CompanyRouteRate, "companyRouteRateId" | "createdAt" | "updatedAt">
): void {
  if (!rateData.companyId?.trim()) {
    throw new Error("Company ID is required.");
  }

  if (!rateData.fromBranchId?.trim()) {
    throw new Error("From Branch ID is required.");
  }

  if (!rateData.toBranchId?.trim()) {
    throw new Error("To Branch ID is required.");
  }

  if (rateData.fromBranchId === rateData.toBranchId) {
    throw new Error("From Branch and To Branch cannot be the same.");
  }

  if (!rateData.packageId?.trim()) {
    throw new Error("Package ID is required.");
  }

  if (typeof rateData.transportRate !== "number" || isNaN(rateData.transportRate) || rateData.transportRate < 0) {
    throw new Error("Transport Rate must be a number greater than or equal to 0.");
  }

  if (typeof rateData.pickupCharge !== "number" || isNaN(rateData.pickupCharge) || rateData.pickupCharge < 0) {
    throw new Error("Pickup Charge must be a number greater than or equal to 0.");
  }

  if (typeof rateData.deliveryCharge !== "number" || isNaN(rateData.deliveryCharge) || rateData.deliveryCharge < 0) {
    throw new Error("Delivery Charge must be a number greater than or equal to 0.");
  }

  if (!["Active", "Inactive"].includes(rateData.status)) {
    throw new Error("Status must be either Active or Inactive.");
  }
}
