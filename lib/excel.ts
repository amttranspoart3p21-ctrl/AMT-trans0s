import ExcelJS from "exceljs";
//for createing the excel workbook , worksheet etc...
import fs from "fs";
//for means File System.It lets Node.js work with files and folders.Examples:Create a folder Delete a folder Read a file Write a file    
import path from "path";
// path helps us build file paths safely.


// if the system dont have the setup of storage its creat automatically [starts] 

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

// if the system dont have the setup of storage its creat automatically [ends] 

// creating the year based folder for maintain the monthly based excel file [starts]

export function createYearFolder(year: number) {
  const yearPath = path.join(EXCEL_PATH, year.toString());

  if (!fs.existsSync(yearPath)) {
    fs.mkdirSync(yearPath);
    console.log(`✅ ${year} folder created`);
  }

  return yearPath;
}

// creating the year based folder for maintain the monthly based excel file [ends]


function createShipmentWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet("Shipments");

  worksheet.columns = [
    // --- SECTION 1: CORE LOGISTICS & SHIPMENT INFO ---
    { header: "Shipment ID", key: "shipmentId", width: 20 },                     // Auto Generated
    { header: "Date", key: "date", width: 15 },                                 // Required
    { header: "Vehicle Number", key: "vehicleNumber", width: 20 },               // Required
    
    // --- SECTION 2: ROUTING (ORIGIN & DESTINATION) ---
    { header: "From AMT Branch", key: "fromAmtBranch", width: 20 },             // Required
    { header: "From Company", key: "fromCompany", width: 25 },                   // Required
    { header: "To AMT Branch", key: "toAmtBranch", width: 20 },                 // Required
    { header: "To Company", key: "toCompany", width: 25 },                       // Required
    
    // --- SECTION 3: CARGO DETAILS ---
    { header: "Package Type", key: "packageType", width: 15 },                   // Required
    { header: "Quantity", key: "quantity", width: 12 },                         // Required
    
    // --- SECTION 4: INVOICING & BILLING ---
    { header: "Our Company Invoice Number", key: "ourInvoiceNumber", width: 25 }, // Required
    { header: "Customer Company Invoice Number", key: "customerInvoiceNumber", width: 28 }, // Optional
    { header: "Payment Company", key: "paymentCompany", width: 25 },             // Optional (Required for Billing)
    { header: "Price Per Piece", key: "pricePerPiece", width: 15 },               // Optional (Required for Billing)
    { header: "Total Amount", key: "totalAmount", width: 15 },                   // Auto Calculated (Required for Billing)
    
    // --- SECTION 5: OPERATIONAL STATUSES (AT THE END) ---
    { header: "Delivery Status", key: "deliveryStatus", width: 18 },             // Required (Delivered/Not Delivered...)
    { header: "Payment Status", key: "paymentStatus", width: 15 }                // Required (Paid/Pending/Free)
  ];

  return worksheet;
}

export async function getMonthlyWorkbook(year: number, month: string) {
  // Assumes createYearFolder is defined elsewhere in lib/excel.ts
  const yearPath = createYearFolder(year); 
  
  const workbookPath = path.join(
  yearPath,
  `${year}-${month}.xlsx`
);

  const workbook = new ExcelJS.Workbook();

  // if (fs.existsSync(workbookPath)) {
  //   await workbook.xlsx.readFile(workbookPath);
  //   console.log(`📂 Opened existing workbook: ${month}.xlsx`);
  // } 

  if (fs.existsSync(workbookPath)) {
  await workbook.xlsx.readFile(workbookPath);

  const worksheet = workbook.getWorksheet("Shipments");

console.log(
  worksheet?.getSheetValues()
);

  // const worksheet = workbook.getWorksheet("Shipments");

  console.log(`📂 Opened existing workbook: ${month}.xlsx`);
  console.log("Rows after read:", worksheet?.rowCount);
}
  
  
  else {
    // Single Responsibility Principle in action!
    createShipmentWorksheet(workbook);
    
    // Persist the newly setup workbook structure immediately
    await workbook.xlsx.writeFile(workbookPath);
    
    console.log(`✅ Created fresh workbook structure: ${month}.xlsx`);
  }

  return {
    workbook,
    workbookPath,
  };
}









