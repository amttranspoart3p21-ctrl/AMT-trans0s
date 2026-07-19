// // v1
// import ExcelJS from "exceljs";
// import { createStorageFolders,createYearFolder,getMonthlyWorkbook } from "../lib/excel";

// async function main() {
    
//     createStorageFolders();

//      await getMonthlyWorkbook(2025, "May");

//     const yearFolder = createYearFolder(2032);

//     console.log(yearFolder);
    
//     const workbook = new ExcelJS.Workbook();

//   const worksheet = workbook.addWorksheet("Shipments");

// //   excel sheet schma or like modal DB structure

// worksheet.columns = [
//   // --- SECTION 1: CORE LOGISTICS & SHIPMENT INFO ---
//   { header: "Shipment ID", key: "shipmentId", width: 20 },                     // Auto Generated
//   { header: "Date", key: "date", width: 15 },                                 // Required
//   { header: "Vehicle Number", key: "vehicleNumber", width: 20 },               // Required
  
//   // --- SECTION 2: ROUTING (ORIGIN & DESTINATION) ---
//   { header: "From AMT Branch", key: "fromAmtBranch", width: 20 },             // Required
//   { header: "From Company", key: "fromCompany", width: 25 },                   // Required
//   { header: "To AMT Branch", key: "toAmtBranch", width: 20 },                 // Required
//   { header: "To Company", key: "toCompany", width: 25 },                       // Required
  
//   // --- SECTION 3: CARGO DETAILS ---
//   { header: "Package Type", key: "packageType", width: 15 },                   // Required
//   { header: "Quantity", key: "quantity", width: 12 },                         // Required
//   { header: "Price Per Piece", key: "pricePerPiece", width: 15 },               // Optional (Required for Billing)
//   { header: "Total Amount", key: "totalAmount", width: 15 },                   // Auto Calculated (Required for Billing)
  
//   // --- SECTION 4: INVOICING & BILLING ---
//   { header: "Our Company Invoice Number", key: "ourInvoiceNumber", width: 25 }, // Required
//   { header: "Customer Company Invoice Number", key: "customerInvoiceNumber", width: 28 }, // Optional
//   { header: "Payment Company", key: "paymentCompany", width: 25 },             // Optional (Required for Billing)
 
  
//   // --- SECTION 5: OPERATIONAL STATUSES (AT THE END) ---
//   { header: "Delivery Status", key: "deliveryStatus", width: 18 },             // Required (Delivered/Not Delivered...)
//   { header: "Payment Status", key: "paymentStatus", width: 15 }                // Required (Paid/Pending/Free)
// ];

// // dummy data for testing
//   worksheet.addRow({
//   shipmentId: "SHP000001",
//   date: "18-07-2026",
//   vehicleNumber: "TN09AB1234",

//   fromAmtBranch: "Ambur",
//   fromCompany: "ABC Textiles",

//   toAmtBranch: "Chennai",
//   toCompany: "XYZ Exports",

//   packageType: "Box",
//   quantity: 10,

//   pricePerPiece: 50,
//   totalAmount: 500,

//   ourInvoiceNumber: "INV001",
//   customerInvoiceNumber: "CINV001",

//   paymentCompany: "ABC Textiles",
//   paymentStatus: "Pending",
//   deliveryStatus: "Not Delivered",
// });
 
//   await workbook.xlsx.writeFile("Test.xlsx");

//   console.log("✅ Excel file created successfully!");
// }

// main();

// v2

// import {
//   createStorageFolders,
//   createYearFolder,
//   getMonthlyWorkbook,
// } from "../lib/excel";

// async function main() {
//   createStorageFolders();

//   await getMonthlyWorkbook(2025, "june");

//   const yearFolder = createYearFolder(2032);

//   console.log(yearFolder);
// }

// main();

// v3

// import {
//   createStorageFolders,
// //   addShipment,
// } from "../lib/excel";
// import { createShipment } from "@/services/shipment.service";

// async function main() {
//   createStorageFolders();

//   await createShipment(2022, "June", {
// //   shipmentId: "SHP000001",
//   date: "50-05-2025",
//   vehicleNumber: "TN09AB1234",

//   fromAmtBranch: "Ambur",
//   fromCompany: "ABC Textiles",

//   toAmtBranch: "Chennai",
//   toCompany: "XYZ Exports",

//   packageType: "Box",
//   quantity: 1,

//   pricePerPiece: 100,
// //   totalAmount: 500,

//   ourInvoiceNumber: "INV001",
//   customerInvoiceNumber: "CINV001",

//   paymentCompany: "ABC Textiles",

//   deliveryStatus: "Pending",
//   paymentStatus: "Pending",
// });

// }



// main();



// v4

import { createStorageFolders } from "../lib/excel";
import { createShipment } from "@/services/shipment.service";

async function main() {
  createStorageFolders();

  // ---------------- Row 1 ----------------
  await createShipment(2020, "June", {
    date: "01-06-2022",
    vehicleNumber: "TN09AB1234",

    fromAmtBranch: "Ambur",
    fromCompany: "ABC Textiles",

    toAmtBranch: "Chennai",
    toCompany: "XYZ Exports",

    packageType: "Box",
    quantity: 2,

    pricePerPiece: 100,

    ourInvoiceNumber: "INV001",
    customerInvoiceNumber: "CINV001",

    paymentCompany: "ABC Textiles",

    deliveryStatus: "Pending",
    paymentStatus: "Pending",
  });

  // ---------------- Row 2 ----------------
  await createShipment(2020, "June", {
    date: "02-06-2022",
    vehicleNumber: "TN09AB5678",

    fromAmtBranch: "Ambur",
    fromCompany: "DEF Textiles",

    toAmtBranch: "Vellore",
    toCompany: "PQR Traders",

    packageType: "Bag",
    quantity: 5,

    pricePerPiece: 250,

    ourInvoiceNumber: "INV002",
    customerInvoiceNumber: "CINV002",

    paymentCompany: "DEF Textiles",

    deliveryStatus: "Pending",
    paymentStatus: "Pending",
  });

  // ---------------- Row 3 ----------------
  await createShipment(2020, "June", {
    date: "03-06-2022",
    vehicleNumber: "TN09AB9999",

    fromAmtBranch: "Chennai",
    fromCompany: "LMN Industries",

    toAmtBranch: "Ranipet",
    toCompany: "RST Exports",

    packageType: "Bundle",
    quantity: 3,

    pricePerPiece: 500,

    ourInvoiceNumber: "INV003",
    customerInvoiceNumber: "CINV003",

    paymentCompany: "LMN Industries",

    deliveryStatus: "Delivered",
    paymentStatus: "Paid",
  });

  console.log("✅ Test Completed");
}

main();








// to test this run this [ npx tsx scripts/excel-test.ts ] in terminal 