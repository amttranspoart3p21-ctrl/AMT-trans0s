// branch excel sheet header


type ExcelColumn = {
  header: string;
  key: string;
  width?: number;
};
    
export const BRANCH_COLUMNS: ExcelColumn[] = [

    
  // --- SECTION 1: BASIC INFORMATION ---
  {
    header: "Branch ID",
    key: "branchId",
    width: 18,
  },
  {
    header: "Branch Name",
    key: "branchName",
    width: 30,
  },
  {
    header: "Branch Code",
    key: "branchCode",
    width: 18,
  },

  // --- SECTION 2: CONTACT INFORMATION ---
  {
    header: "Address",
    key: "address",
    width: 45,
  },
  {
    header: "Phone Number 1",
    key: "phoneNumber1",
    width: 18,
  },
  {
    header: "Phone Number 2",
    key: "phoneNumber2",
    width: 18,
  },
  {
    header: "Phone Number 3",
    key: "phoneNumber3",
    width: 18,
  },
  {
    header: "Phone Number 4",
    key: "phoneNumber4",
    width: 18,
  },
  {
    header: "Phone Number 5",
    key: "phoneNumber5",
    width: 18,
  },

  // --- SECTION 3: STATUS ---
  {
    header: "Status",
    key: "status",
    width: 15,
  },

  // --- SECTION 4: AUDIT ---
  {
    header: "Created At",
    key: "createdAt",
    width: 24,
  },
  {
    header: "Updated At",
    key: "updatedAt",
    width: 24,
  },
];