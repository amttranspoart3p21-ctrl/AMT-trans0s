export interface Company {
  companyId: string;   

  branchId: string;      
  branchName: string;    // requred

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