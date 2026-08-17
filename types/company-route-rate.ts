export interface CompanyRouteRate {
  companyRouteRateId: string;

  companyId: string;
  companyName: string;
  companySide: "FROM" | "TO";

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
  inactiveReason?: string;

  createdAt: string;
  updatedAt: string;
}

