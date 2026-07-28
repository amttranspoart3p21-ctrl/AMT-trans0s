import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import type { Company } from "@/types/company";
import { readBranches } from "@/lib/branch";
import {
  COMPANY_COLUMNS,
  COMPANY_FILE,
  WORKSHEET_NAME,
} from "@/constants/company-columns";



const MASTER_DATA_FOLDER = path.join(
  process.cwd(),
  "storage",
  "excel",
  "master-data"
);

// this function is use for create the master-data folder and Branches.xlsx if not exist [starts]
// it will automatically create the file with the header row if not exist  
// and check wether master-data folder and Branches.xlsx already exists
// and if folder and excelfile does not exist it will create it and add the header of excel sheet automatically
export async function ensureCompanyWorkbook(): Promise<void> {
  // Create the master-data folder if it doesn't exist
  await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

  // Check whether Branches.xlsx already exists
  try {
    await fs.access(COMPANY_FILE);
    return; // Workbook already exists
  } catch {
    // File doesn't exist, so we'll create it
  }

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);

  worksheet.columns = COMPANY_COLUMNS;

  await workbook.xlsx.writeFile(COMPANY_FILE);
}

// this function is use for create the master-data folder and Branches.xlsx if not exist [ends]

// this function Make sure the workbook exists [starts]
// this function is use for get the workbook of Branches.xlsx 

export async function getCompanyWorkbook(): Promise<ExcelJS.Workbook> {
  // Make sure the workbook exists
  await ensureCompanyWorkbook();

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(COMPANY_FILE);

  return workbook;
}

// this function Make sure the workbook exists [ends]

// this function is use for get the worksheet of Branches.xlsx [starts]
// ✅ If July.xlsx exists → Open it.
// ❌ If it doesn't exist → Create it.

export async function getCompanyWorksheet(): Promise<ExcelJS.Worksheet> {
  const workbook = await getCompanyWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);

    worksheet.columns = COMPANY_COLUMNS;

    await workbook.xlsx.writeFile(COMPANY_FILE);
  }

  return worksheet;
}

// this function is use for get the worksheet of Branches.xlsx [ends]

export async function readCompanies(): Promise<Company[]> {
  const worksheet = await getCompanyWorksheet();
  const branches = await readBranches();
  const branchMap = new Map(branches.map((b) => [b.branchId, b.branchCode]));

  const companies: Company[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip the header row
    if (rowNumber === 1) return;

    const companyId = row.getCell(1).value?.toString() ?? "";
    const branchId = row.getCell(2).value?.toString() ?? "";
    const branchName = row.getCell(3).value?.toString() ?? "";
    const companyName = row.getCell(4).value?.toString() ?? "";
    const branchCode = branchMap.get(branchId) || "";
    const displayName = branchCode ? `${companyName} - ${branchCode}` : companyName;

    companies.push({
      companyId,
      branchId,
      branchName,
      companyName,
      branchCode,
      displayName,
      address: row.getCell(5).value?.toString() ?? "",
      phoneNumber1: row.getCell(6).value?.toString() ?? "",
      phoneNumber2: row.getCell(7).value?.toString() ?? undefined,
      phoneNumber3: row.getCell(8).value?.toString() ?? undefined,
      email: row.getCell(9).value?.toString() ?? undefined,
      gstNumber: row.getCell(10).value?.toString() ?? undefined,
      status: (row.getCell(11).value?.toString() as Company["status"]) ?? "Active",
      createdAt: row.getCell(12).value?.toString() ?? "",
      updatedAt: row.getCell(13).value?.toString() ?? "",
    });
  });

  return companies;
}

export async function writeCompanies(companies: Company[]): Promise<void> {
  const workbook = await getCompanyWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  }
  worksheet.columns = COMPANY_COLUMNS;

  // Remove all existing data rows (keep header row)
  if (worksheet.rowCount > 1) {
    for (let i = worksheet.rowCount; i > 1; i--) {
      worksheet.spliceRows(i, 1);
    }
  }

  // Add updated branch data
  companies.forEach((company) => {
    worksheet.addRow({
      companyId: company.companyId,
      branchId: company.branchId,
      branchName: company.branchName,
      companyName: company.companyName,
      address: company.address,
      phoneNumber1: company.phoneNumber1,
      phoneNumber2: company.phoneNumber2,
      phoneNumber3: company.phoneNumber3,
      email: company.email,
      gstNumber: company.gstNumber,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  });

 await workbook.xlsx.writeFile(COMPANY_FILE);
}
