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

  status: "Active" | "Shutdown";

  createdAt: string;
  updatedAt: string;
}