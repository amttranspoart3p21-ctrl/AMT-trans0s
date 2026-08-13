import type { Column } from "exceljs";

export const COMPANY_FILE = "storage/excel/master-data/Companies.xlsx";

export const WORKSHEET_NAME = "Companies";

export const COMPANY_COLUMNS: Partial<Column>[] = [
  { header: "Company ID", key: "companyId", width: 15 },

  { header: "Branch ID", key: "branchId", width: 15 },
  { header: "Branch Name", key: "branchName", width: 25 },

  { header: "Company Name", key: "companyName", width: 35 },

  { header: "Address", key: "address", width: 40 },

  { header: "Phone Number 1", key: "phoneNumber1", width: 18 },
  { header: "Phone Number 2", key: "phoneNumber2", width: 18 },
  { header: "Phone Number 3", key: "phoneNumber3", width: 18 },

  { header: "Email", key: "email", width: 35 },

  { header: "GST Number", key: "gstNumber", width: 25 },

  { header: "Status", key: "status", width: 15 },

  { header: "Created At", key: "createdAt", width: 25 },
  { header: "Updated At", key: "updatedAt", width: 25 },
  { header: "Inactive Reason", key: "inactiveReason", width: 25 },
];