import ExcelJS from "exceljs";
import fs from "fs/promises";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import {
  ROUTE_RATE_COLUMNS,
  ROUTE_RATE_FILE,
  WORKSHEET_NAME,
  MASTER_DATA_FOLDER,
} from "@/constants/global-route-rate-columns";

export async function ensureGlobalRouteRateWorkbook(): Promise<void> {
  await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

  try {
    await fs.access(ROUTE_RATE_FILE);
    return;
  } catch {
    // File doesn't exist, create it
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  worksheet.columns = ROUTE_RATE_COLUMNS;

  await workbook.xlsx.writeFile(ROUTE_RATE_FILE);
}

export async function getGlobalRouteRateWorkbook(): Promise<ExcelJS.Workbook> {
  await ensureGlobalRouteRateWorkbook();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(ROUTE_RATE_FILE);

  return workbook;
}

export async function getGlobalRouteRateWorksheet(): Promise<ExcelJS.Worksheet> {
  const workbook = await getGlobalRouteRateWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
    worksheet.columns = ROUTE_RATE_COLUMNS;
    await workbook.xlsx.writeFile(ROUTE_RATE_FILE);
  }

  return worksheet;
}

export async function readGlobalRouteRates(): Promise<GlobalRouteRate[]> {
  const worksheet = await getGlobalRouteRateWorksheet();
  const rates: GlobalRouteRate[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    rates.push({
      routeRateId: row.getCell(1).value?.toString() ?? "",
      fromBranchId: row.getCell(2).value?.toString() ?? "",
      fromBranchName: row.getCell(3).value?.toString() ?? "",
      toBranchId: row.getCell(4).value?.toString() ?? "",
      toBranchName: row.getCell(5).value?.toString() ?? "",
      packageId: row.getCell(6).value?.toString() ?? "",
      packageName: row.getCell(7).value?.toString() ?? "",
      rate: Number(row.getCell(8).value) || 0,
      status: (row.getCell(9).value?.toString() as GlobalRouteRate["status"]) ?? "Active",
      createdAt: row.getCell(10).value?.toString() ?? "",
      updatedAt: row.getCell(11).value?.toString() ?? "",
    });
  });

  return rates;
}

export async function writeGlobalRouteRates(rates: GlobalRouteRate[]): Promise<void> {
  const workbook = await getGlobalRouteRateWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  }
  worksheet.columns = ROUTE_RATE_COLUMNS;

  if (worksheet.rowCount > 1) {
    for (let i = worksheet.rowCount; i > 1; i--) {
      worksheet.spliceRows(i, 1);
    }
  }

  rates.forEach((rateItem) => {
    worksheet.addRow({
      routeRateId: rateItem.routeRateId,
      fromBranchId: rateItem.fromBranchId,
      fromBranchName: rateItem.fromBranchName,
      toBranchId: rateItem.toBranchId,
      toBranchName: rateItem.toBranchName,
      packageId: rateItem.packageId,
      packageName: rateItem.packageName,
      rate: rateItem.rate,
      status: rateItem.status,
      createdAt: rateItem.createdAt,
      updatedAt: rateItem.updatedAt,
    });
  });

  await workbook.xlsx.writeFile(ROUTE_RATE_FILE);
}
