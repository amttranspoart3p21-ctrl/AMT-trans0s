export interface Company {
  companyId: string;   

  branchId: string;      
  branchName: string;    // requred
  branchCode?: string;   // resolved dynamically
  displayName?: string;  // resolved dynamically: "CompanyName - BranchCode"

  companyName: string;   // requred
  address: string;       // optional

  phoneNumber1: string;  // optional
  phoneNumber2?: string;  // optional
  phoneNumber3?: string;   // optional

  email?: string;        // optional
  gstNumber?: string;    // optional

  status: "Active" | "Inactive"; // requred

  createdAt: string;
  updatedAt: string;
}