import ExcelJS from "exceljs";
import fs from "fs/promises";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import {
  COMPANY_ROUTE_RATE_COLUMNS,
  COMPANY_ROUTE_RATE_FILE,
  WORKSHEET_NAME,
  MASTER_DATA_FOLDER,
} from "@/constants/company-route-rate-columns";

export async function ensureCompanyRouteRateWorkbook(): Promise<void> {
  await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

  try {
    await fs.access(COMPANY_ROUTE_RATE_FILE);
    return;
  } catch {
    // File doesn't exist, create it
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  worksheet.columns = COMPANY_ROUTE_RATE_COLUMNS;

  await workbook.xlsx.writeFile(COMPANY_ROUTE_RATE_FILE);
}

export async function getCompanyRouteRateWorkbook(): Promise<ExcelJS.Workbook> {
  await ensureCompanyRouteRateWorkbook();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(COMPANY_ROUTE_RATE_FILE);

  return workbook;
}

export async function getCompanyRouteRateWorksheet(): Promise<ExcelJS.Worksheet> {
  const workbook = await getCompanyRouteRateWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
    worksheet.columns = COMPANY_ROUTE_RATE_COLUMNS;
    await workbook.xlsx.writeFile(COMPANY_ROUTE_RATE_FILE);
  }

  return worksheet;
}

export async function readCompanyRouteRates(): Promise<CompanyRouteRate[]> {
  const worksheet = await getCompanyRouteRateWorksheet();
  const rates: CompanyRouteRate[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    rates.push({
      companyRouteRateId: row.getCell(1).value?.toString() ?? "",
      companyId: row.getCell(2).value?.toString() ?? "",
      companyName: row.getCell(3).value?.toString() ?? "",
      fromBranchId: row.getCell(4).value?.toString() ?? "",
      fromBranchName: row.getCell(5).value?.toString() ?? "",
      toBranchId: row.getCell(6).value?.toString() ?? "",
      toBranchName: row.getCell(7).value?.toString() ?? "",
      packageId: row.getCell(8).value?.toString() ?? "",
      packageName: row.getCell(9).value?.toString() ?? "",
      transportRate: Number(row.getCell(10).value) || 0,
      pickupCharge: Number(row.getCell(11).value) || 0,
      deliveryCharge: Number(row.getCell(12).value) || 0,
      status: (row.getCell(13).value?.toString() as CompanyRouteRate["status"]) ?? "Active",
      createdAt: row.getCell(14).value?.toString() ?? "",
      updatedAt: row.getCell(15).value?.toString() ?? "",
    });
  });

  return rates;
}

export async function writeCompanyRouteRates(rates: CompanyRouteRate[]): Promise<void> {
  const workbook = await getCompanyRouteRateWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  }
  worksheet.columns = COMPANY_ROUTE_RATE_COLUMNS;

  if (worksheet.rowCount > 1) {
    for (let i = worksheet.rowCount; i > 1; i--) {
      worksheet.spliceRows(i, 1);
    }
  }

  rates.forEach((rateItem) => {
    worksheet.addRow({
      companyRouteRateId: rateItem.companyRouteRateId,
      companyId: rateItem.companyId,
      companyName: rateItem.companyName,
      fromBranchId: rateItem.fromBranchId,
      fromBranchName: rateItem.fromBranchName,
      toBranchId: rateItem.toBranchId,
      toBranchName: rateItem.toBranchName,
      packageId: rateItem.packageId,
      packageName: rateItem.packageName,
      transportRate: rateItem.transportRate,
      pickupCharge: rateItem.pickupCharge,
      deliveryCharge: rateItem.deliveryCharge,
      status: rateItem.status,
      createdAt: rateItem.createdAt,
      updatedAt: rateItem.updatedAt,
    });
  });

  await workbook.xlsx.writeFile(COMPANY_ROUTE_RATE_FILE);
}
