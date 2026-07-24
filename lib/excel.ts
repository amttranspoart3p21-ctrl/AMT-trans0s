


import ExcelJS from "exceljs";
//for createing the excel workbook , worksheet etc...
import fs from "fs";
//for means File System.It lets Node.js work with files and folders.Examples:Create a folder Delete a folder Read a file Write a file    
import path from "path";
// path helps us build file paths safely.


// 1 one 
// if the system dont have the setup of storage folder its creat automatically [starts] 

const STORAGE_PATH = path.join(process.cwd(), "storage");
const EXCEL_PATH = path.join(STORAGE_PATH, "excel");
const IMAGE_PATH = path.join(STORAGE_PATH, "images");
const METADATA_PATH = path.join(STORAGE_PATH, "metadata");
const COUNTER_FILE = path.join(METADATA_PATH, "shipment-counter.json");

export function createStorageFolders() {
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH);
    console.log("✅ storage folder created");
  }

  if (!fs.existsSync(EXCEL_PATH)) {
    fs.mkdirSync(EXCEL_PATH);
    console.log("✅ excel folder created");
  }

  if (!fs.existsSync(IMAGE_PATH)) {
    fs.mkdirSync(IMAGE_PATH);
    console.log("✅ images folder created");
  }

  if (!fs.existsSync(METADATA_PATH)) {
  fs.mkdirSync(METADATA_PATH);
  console.log("✅ metadata folder created");
}

 if (!fs.existsSync(COUNTER_FILE)) {
  fs.writeFileSync(
    COUNTER_FILE,
    JSON.stringify(
      {
        lastShipmentNumber: 0,
      },
      null,
      2
    )
  );

  console.log("✅ shipment-counter.json created");
}
}

// if the system dont have the setup of storage folder its creat automatically [ends] 

// 2 two 

// creating the year based folder for maintain the monthly based excel file  its have that logic also if dont exits its creat automatically if the excett open  that folder only [starts]

export function createYearFolder(year: number) {
  const yearPath = path.join(EXCEL_PATH, year.toString());

  if (!fs.existsSync(yearPath)) {
    fs.mkdirSync(yearPath);
    console.log(`✅ ${year} folder created`);
  }

  return yearPath;
}

// creating the year based folder for maintain the monthly based excel file [ends]


// 5 five

// Analogy: checking if your notebook is already open on the desk. If yes, use it. If no, open a new one. [starts]

export async function getMonthlyWorkbook(year: number, month: string) {
  // Assumes createYearFolder is defined elsewhere in lib/excel.ts
  const yearPath = createYearFolder(year); 
  
  const workbookPath = path.join(
    yearPath,
    `${year}-${month}.xlsx`
  );

  const workbook = new ExcelJS.Workbook();

  if (fs.existsSync(workbookPath)) {
    await workbook.xlsx.readFile(workbookPath);
    console.log(`📂 Opened existing workbook: ${month}.xlsx`);
  } else {
    console.log(`📂 Prepared new workbook reference: ${month}.xlsx`);
  }

  return {
    workbook,
    workbookPath,
  };
}

// Analogy: checking if your notebook is already open on the desk. If yes, use it. If no, open a new one. [ends]








