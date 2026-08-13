export interface PackageStatsData {
  routeRates: number;
}

export interface Package {
  packageId: string;

  packageName: string;

  companyId?: string;
  companyName?: string;

  description?: string;

  status: "Active" | "Inactive";
  inactiveReason?: string;

  createdAt: string;
  updatedAt: string;

  stats?: PackageStatsData;
}