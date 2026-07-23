export interface PackageType {
  packageId: string;

  packageName: string;

  description?: string;

  status: "Active" | "Inactive";

  createdAt: string;
  updatedAt: string;
}