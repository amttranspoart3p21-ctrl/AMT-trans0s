// import { createStorageFolders } from "../lib/excel";
// import { createShipment } from "@/services/shipment.service";
// import fs from "fs";
// import path from "path";

// async function verifyPath(expectedRelativePath: string, expectedSheetName: string) {
//   const fullPath = path.join(process.cwd(), expectedRelativePath);
//   if (fs.existsSync(fullPath)) {
//     console.log(`  [OK] File exists at: ${expectedRelativePath}`);
//   } else {
//     console.error(`  [FAIL] File NOT found at: ${expectedRelativePath}`);
//   }
// }

// async function main() {
//   console.log("🚀 Starting Dynamic Workbook Selection Verification...");
//   createStorageFolders();

//   const testCases = [
//     { date: "2026-07-31", path: "storage/excel/2026/2026-July.xlsx" },
//     { date: "2026-05-15", path: "storage/excel/2026/2026-May.xlsx" },
//     { date: "2030-06-15", path: "storage/excel/2030/2030-June.xlsx" },
//     { date: "2010-06-25", path: "storage/excel/2010/2010-June.xlsx" },
//     { date: "2000-07-05", path: "storage/excel/2000/2000-July.xlsx" }
//   ];

//   for (const tc of testCases) {
//     console.log(`\n----------------------------------------`);
//     console.log(`Running test case for date: ${tc.date}`);
//     console.log(`Expected workbook path: ${tc.path}`);
    
//     // We pass year=0 and month="" parameters to verify that the service ignores them
//     // and derives them dynamically from resolvedShipment.date!
//     await createShipment(0, "", {
//       date: tc.date,
//       vehicleNumber: "TN23-MOCK",
//       fromAmtBranch: "Ranipet",
//       fromCompany: "Origin Textiles",
//       toAmtBranch: "Chennai",
//       toCompany: "Destination Co",
//       packageType: "Box",
//       quantity: "5",
//       ourInvoiceNumber: "TX-9999",
//       customerInvoiceNumber: "CUST-9999",
//       paymentCompany: "Origin Textiles",
//       paymentReceivingBranch: "From Company",
//       pickupService: "Branch",
//       deliveryService: "Branch",
//       deliveryStatus: "Not Delivered",
//       paymentStatus: "Pending"
//     });

//     await verifyPath(tc.path, tc.date);
//   }

//   console.log("\n========================================");
//   console.log("✅ All test cases executed successfully!");
// }

// main().catch((err) => {
//   console.error("❌ Test script failed with error:", err);
// });
