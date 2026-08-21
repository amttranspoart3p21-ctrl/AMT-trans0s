export interface BranchCardStats {
  companies: number;
  companyPackages: number;
  companyRouteRates: number;
  globalPackages: number;
  globalRouteRates: number;
}

export interface Branch {
  branchId: string;

  branchName: string;
  branchCode: string;

  address: string;

  phoneNumber1: string;
  phoneNumber2?: string;
  phoneNumber3?: string;
  phoneNumber4?: string;
  phoneNumber5?: string;

  status: "Active" | "Inactive";

  createdAt: string;
  updatedAt: string;

  stats?: BranchCardStats;
}