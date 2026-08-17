import { Column } from "exceljs";
import path from "path";

export const COMPANY_ROUTE_RATE_COLUMNS: Partial<Column>[] = [
  { header: "Company Route Rate ID", key: "companyRouteRateId", width: 20 },
  { header: "Company ID", key: "companyId", width: 15 },
  { header: "Company Name", key: "companyName", width: 25 },
  { header: "Company Side", key: "companySide", width: 15 },
  { header: "From Branch ID", key: "fromBranchId", width: 15 },
  { header: "From Branch Name", key: "fromBranchName", width: 25 },
  { header: "To Branch ID", key: "toBranchId", width: 15 },
  { header: "To Branch Name", key: "toBranchName", width: 25 },
  { header: "Package ID", key: "packageId", width: 15 },
  { header: "Package Name", key: "packageName", width: 25 },
  { header: "Transport Rate", key: "transportRate", width: 15 },
  { header: "Pickup Charge", key: "pickupCharge", width: 15 },
  { header: "Delivery Charge", key: "deliveryCharge", width: 15 },
  { header: "Status", key: "status", width: 15 },
  { header: "Created At", key: "createdAt", width: 25 },
  { header: "Updated At", key: "updatedAt", width: 25 },
  { header: "Inactive Reason", key: "inactiveReason", width: 25 },
];


export const WORKSHEET_NAME = "Company Route Rates";

export const MASTER_DATA_FOLDER = path.join(
  process.cwd(),
  "storage",
  "excel",
  "master-data"
);

export const COMPANY_ROUTE_RATE_FILE = path.join(
  MASTER_DATA_FOLDER,
  "CompanyRouteRates.xlsx"
);
