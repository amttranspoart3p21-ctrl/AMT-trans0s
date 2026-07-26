export interface CompanyRouteRate {
  companyRouteRateId: string;

  companyId: string;
  companyName: string;

  fromBranchId: string;
  fromBranchName: string;

  toBranchId: string;
  toBranchName: string;

  packageId: string;
  packageName: string;

  transportRate: number;
  pickupCharge: number;
  deliveryCharge: number;

  status: "Active" | "Inactive";

  createdAt: string;
  updatedAt: string;
}
