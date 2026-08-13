import { Column } from "exceljs";

export const PACKAGE_COLUMNS: Partial<Column>[] = [
  { header: "Package ID", key: "packageId", width: 15 },
  { header: "Package Name", key: "packageName", width: 30 },
  { header: "Company ID", key: "companyId", width: 15 },
  { header: "Company Name", key: "companyName", width: 25 },
  { header: "Description", key: "description", width: 40 },
  { header: "Status", key: "status", width: 15 },
  { header: "Created At", key: "createdAt", width: 25 },
  { header: "Updated At", key: "updatedAt", width: 25 },
  { header: "Inactive Reason", key: "inactiveReason", width: 25 },
];