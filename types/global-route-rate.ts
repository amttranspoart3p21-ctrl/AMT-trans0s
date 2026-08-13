export interface GlobalRouteRate {
  routeRateId: string;

  fromBranchId: string;
  fromBranchName: string;

  toBranchId: string;
  toBranchName: string;

  packageId: string;
  packageName: string;

  rate: number;

  status: "Active" | "Inactive";
  inactiveReason?: string;

  createdAt: string;
  updatedAt: string;
}