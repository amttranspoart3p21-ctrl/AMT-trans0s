export interface Company {
  companyId: string;

  companyName: string;

  branchId: string;

  address?: string;
  phoneNumber?: string;

  status: "Active" | "Inactive";

  createdAt: string;
  updatedAt: string;
}