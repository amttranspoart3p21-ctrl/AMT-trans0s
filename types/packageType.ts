export interface Package {
  packageId: string;

  packageName: string;

  companyId?: string;
  companyName?: string;

  description?: string;

  status: "Active" | "Inactive";

  createdAt: string;
  updatedAt: string;
}