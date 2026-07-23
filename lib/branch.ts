import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";

import { BRANCH_COLUMNS } from "@/constants/branch-columns"; // importing headers for excel sheet of branch 
import type { Branch } from "@/types/branch"; // importing  types for  type script its only for branch 


const MASTER_DATA_FOLDER = path.join(
  process.cwd(),
  "storage",
  "excel",
  "master-data"
);

const BRANCH_FILE = path.join(
  MASTER_DATA_FOLDER,
  "Branches.xlsx"
);

const WORKSHEET_NAME = "Branches";

// this function is use for create the master-data folder and Branches.xlsx if not exist [starts]
// it will automatically create the file with the header row if not exist  
// and check wether master-data folder and Branches.xlsx already exists
// and if folder and excelfile does not exist it will create it and add the header of excel sheet automatically
export async function ensureBranchWorkbook(): Promise<void> {
  // Create the master-data folder if it doesn't exist
  await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

  // Check whether Branches.xlsx already exists
  try {
    await fs.access(BRANCH_FILE);
    return; // Workbook already exists
  } catch {
    // File doesn't exist, so we'll create it
  }

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);

  worksheet.columns = BRANCH_COLUMNS;

  await workbook.xlsx.writeFile(BRANCH_FILE);
}

// this function is use for create the master-data folder and Branches.xlsx if not exist [ends]

// this function Make sure the workbook exists [starts]
// this function is use for get the workbook of Branches.xlsx 

export async function getBranchWorkbook(): Promise<ExcelJS.Workbook> {
  // Make sure the workbook exists
  await ensureBranchWorkbook();

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(BRANCH_FILE);

  return workbook;
}

// this function Make sure the workbook exists [ends]

// this function is use for get the worksheet of Branches.xlsx [starts]
// ✅ If July.xlsx exists → Open it.
// ❌ If it doesn't exist → Create it.

export async function getBranchWorksheet(): Promise<ExcelJS.Worksheet> {
  const workbook = await getBranchWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);

    worksheet.columns = BRANCH_COLUMNS;

    await workbook.xlsx.writeFile(BRANCH_FILE);
  }

  return worksheet;
}

// this function is use for get the worksheet of Branches.xlsx [ends]

export async function readBranches(): Promise<Branch[]> {
  const worksheet = await getBranchWorksheet();

  const branches: Branch[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip the header row
    if (rowNumber === 1) return;

    branches.push({
      branchId: row.getCell(1).value?.toString() ?? "",
      branchName: row.getCell(2).value?.toString() ?? "",
      branchCode: row.getCell(3).value?.toString() ?? "",
      address: row.getCell(4).value?.toString() ?? "",

      phoneNumber1: row.getCell(5).value?.toString() ?? "",
      phoneNumber2: row.getCell(6).value?.toString() ?? "",
      phoneNumber3: row.getCell(7).value?.toString() ?? "",
      phoneNumber4: row.getCell(8).value?.toString() ?? "",
      phoneNumber5: row.getCell(9).value?.toString() ?? "",

      status: (row.getCell(10).value?.toString() as Branch["status"]) ?? "Active",

      createdAt: row.getCell(11).value?.toString() ?? "",
      updatedAt: row.getCell(12).value?.toString() ?? "",
    });
  });

  return branches;
}

export async function writeBranches(branches: Branch[]): Promise<void> {
  const workbook = await getBranchWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  }
  worksheet.columns = BRANCH_COLUMNS;

  // Remove all existing data rows (keep header row)
  if (worksheet.rowCount > 1) {
    for (let i = worksheet.rowCount; i > 1; i--) {
      worksheet.spliceRows(i, 1);
    }
  }

  // Add updated branch data
  branches.forEach((branch) => {
    worksheet.addRow({
      branchId: branch.branchId,
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      address: branch.address,

      phoneNumber1: branch.phoneNumber1,
      phoneNumber2: branch.phoneNumber2,
      phoneNumber3: branch.phoneNumber3,
      phoneNumber4: branch.phoneNumber4,
      phoneNumber5: branch.phoneNumber5,

      status: branch.status,

      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    });
  });

  await workbook.xlsx.writeFile(BRANCH_FILE);
}
