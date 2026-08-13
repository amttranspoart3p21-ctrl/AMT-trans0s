// import ExcelJS from "exceljs";
// import fs from "fs/promises";
// import path from "path";
// import type { Package } from "@/types/packageType";
// import {
//     PACKAGE_COLUMNS,
//     PACKAGE_FILE,
//     WORKSHEET_NAME,
// } from "@/constants/package-columns";

// const MASTER_DATA_FOLDER = path.join(
//     process.cwd(),
//     "storage",
//     "excel",
//     "master-data"
// );

// // this function is use for create the master-data folder and Packages.xlsx if not exist [starts]
// // it will automatically create the file with the header row if not exist  
// // and check wether master-data folder and Packages.xlsx already exists
// // and if folder and excelfile does not exist it will create it and add the header of excel sheet automatically
// export async function ensurePackageWorkbook(): Promise<void> {
//     // Create the master-data folder if it doesn't exist
//     await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

//     // Check whether Packages.xlsx already exists
//     try {
//         await fs.access(PACKAGE_FILE);
//         return; // Workbook already exists
//     } catch {
//         // File doesn't exist, so we'll create it
//     }

//     const workbook = new ExcelJS.Workbook();

//     const worksheet = workbook.addWorksheet(WORKSHEET_NAME);

//     worksheet.columns = PACKAGE_COLUMNS;

//     await workbook.xlsx.writeFile(PACKAGE_FILE);
// }

// // this function is use for create the master-data folder and Packages.xlsx if not exist [ends]

// // this function Make sure the workbook exists [starts]
// // this function is use for get the workbook of Packages.xlsx 

// export async function getPackageWorkbook(): Promise<ExcelJS.Workbook> {
//     // Make sure the workbook exists
//     await ensurePackageWorkbook();

//     const workbook = new ExcelJS.Workbook();

//     await workbook.xlsx.readFile(PACKAGE_FILE);

//     return workbook;
// }

// // this function Make sure the workbook exists [ends]

// // this function is use for get the worksheet of Packages.xlsx [starts]
// // ✅ If July.xlsx exists → Open it.
// // ❌ If it doesn't exist → Create it.

// export async function getPackageWorksheet(): Promise<ExcelJS.Worksheet> {
//     const workbook = await getPackageWorkbook();

//     let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

//     if (!worksheet) {
//         worksheet = workbook.addWorksheet(WORKSHEET_NAME);

//         worksheet.columns = PACKAGE_COLUMNS;

//         await workbook.xlsx.writeFile(PACKAGE_FILE);
//     }

//     return worksheet;
// }

// // this function is use for get the worksheet of Packages.xlsx [ends]

// export async function readPackages(): Promise<Package[]> {
//     const worksheet = await getPackageWorksheet();

//     const packages: Package[] = [];

//     worksheet.eachRow((row, rowNumber) => {
//         // Skip the header row
//         if (rowNumber === 1) return;

//         packages.push({
//             packageId: row.getCell(1).value?.toString() ?? "",
//             packageName: row.getCell(2).value?.toString() ?? "",
//             description: row.getCell(3).value?.toString() ?? undefined,
//             status: (row.getCell(4).value?.toString() as Package["status"]) ?? "Active",
//             createdAt: row.getCell(5).value?.toString() ?? "",
//             updatedAt: row.getCell(6).value?.toString() ?? "",
//         });
//     });

//     return packages;
// }

// export async function writePackages(packages: Package[]): Promise<void> {
//     const workbook = await getPackageWorkbook();

//     let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

//     if (!worksheet) {
//         worksheet = workbook.addWorksheet(WORKSHEET_NAME);
//     }
//     worksheet.columns = PACKAGE_COLUMNS;

//     // Remove all existing data rows (keep header row)
//     if (worksheet.rowCount > 1) {
//         for (let i = worksheet.rowCount; i > 1; i--) {
//             worksheet.spliceRows(i, 1);
//         }
//     }

//     // Add updated package data
//     packages.forEach((pkg) => {
//         worksheet.addRow({
//             packageId: pkg.packageId,
//             packageName: pkg.packageName,
//             description: pkg.description,
//             status: pkg.status,
//             createdAt: pkg.createdAt,
//             updatedAt: pkg.updatedAt,
//         });
//     });

//     await workbook.xlsx.writeFile(PACKAGE_FILE);
// }




// v2
import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import type { Package } from "@/types/packageType";
import { PACKAGE_COLUMNS } from "@/constants/package-columns";

const MASTER_DATA_FOLDER = path.join(
  process.cwd(),
  "storage",
  "excel",
  "master-data"
);

const PACKAGE_FILE = path.join(MASTER_DATA_FOLDER, "Packages.xlsx");
const WORKSHEET_NAME = "Packages";

// this function is use for create the master-data folder and Packages.xlsx if not exist [starts]
// it will automatically create the file with the header row if not exist  
// and check wether master-data folder and Packages.xlsx already exists
// and if folder and excelfile does not exist it will create it and add the header of excel sheet automatically
export async function ensurePackageWorkbook(): Promise<void> {
  // Create the master-data folder if it doesn't exist
  await fs.mkdir(MASTER_DATA_FOLDER, { recursive: true });

  // Check whether Packages.xlsx already exists
  try {
    await fs.access(PACKAGE_FILE);
    return; // Workbook already exists
  } catch {
    // File doesn't exist, so we'll create it
  }

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);

  worksheet.columns = PACKAGE_COLUMNS;

  await workbook.xlsx.writeFile(PACKAGE_FILE);
}

// this function is use for create the master-data folder and Packages.xlsx if not exist [ends]

// this function Make sure the workbook exists [starts]
// this function is use for get the workbook of Packages.xlsx 

export async function getPackageWorkbook(): Promise<ExcelJS.Workbook> {
  // Make sure the workbook exists
  await ensurePackageWorkbook();

  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(PACKAGE_FILE);

  return workbook;
}

// this function Make sure the workbook exists [ends]

// this function is use for get the worksheet of Packages.xlsx [starts]
// ✅ If July.xlsx exists → Open it.
// ❌ If it doesn't exist → Create it.

export async function getPackageWorksheet(): Promise<ExcelJS.Worksheet> {
  const workbook = await getPackageWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);

    worksheet.columns = PACKAGE_COLUMNS;

    await workbook.xlsx.writeFile(PACKAGE_FILE);
  }

  return worksheet;
}

// this function is use for get the worksheet of Packages.xlsx [ends]

export async function readPackages(): Promise<Package[]> {
  const worksheet = await getPackageWorksheet();

  const packages: Package[] = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip the header row
    if (rowNumber === 1) return;

    const status = (row.getCell(6).value?.toString() as Package["status"]) ?? "Active";
    const inactiveReason = row.getCell(9).value?.toString() || (status === "Inactive" ? "manual" : undefined);

    packages.push({
      packageId: row.getCell(1).value?.toString() ?? "",
      packageName: row.getCell(2).value?.toString() ?? "",
      companyId: row.getCell(3).value?.toString() || undefined,
      companyName: row.getCell(4).value?.toString() || undefined,
      description: row.getCell(5).value?.toString() || undefined,
      status,
      inactiveReason,
      createdAt: row.getCell(7).value?.toString() ?? "",
      updatedAt: row.getCell(8).value?.toString() ?? "",
    });
  });

  return packages;
}

export async function writePackages(packages: Package[]): Promise<void> {
  const workbook = await getPackageWorkbook();

  let worksheet = workbook.getWorksheet(WORKSHEET_NAME);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(WORKSHEET_NAME);
  }
  worksheet.columns = PACKAGE_COLUMNS;

  // Remove all existing data rows (keep header row)
  if (worksheet.rowCount > 1) {
    for (let i = worksheet.rowCount; i > 1; i--) {
      worksheet.spliceRows(i, 1);
    }
  }

  // Add updated package data
  packages.forEach((pkg) => {
    worksheet.addRow({
      packageId: pkg.packageId,
      packageName: pkg.packageName,
      companyId: pkg.companyId,
      companyName: pkg.companyName,
      description: pkg.description,
      status: pkg.status,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      inactiveReason: pkg.inactiveReason,
    });
  });

  await workbook.xlsx.writeFile(PACKAGE_FILE);
}