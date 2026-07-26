import type { Package } from "@/types/packageType";

export function validatePackage(
  packageData: Omit<Package, "packageId" | "createdAt" | "updatedAt">
): void {
  // Package Name
  if (!packageData.packageName.trim()) {
    throw new Error("Package name is required.");
  }

  // Status
  if (!["Active", "Inactive"].includes(packageData.status)) {
    throw new Error("Invalid package status.");
  }
}