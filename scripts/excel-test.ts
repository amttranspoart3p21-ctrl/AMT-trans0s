
// v4

import { createStorageFolders } from "../lib/excel";
import { createShipment } from "@/services/shipment.service";

async function main() {
  createStorageFolders();
// ---------------- Row 1 ----------------
await createShipment(2026, "December", {
  date: "01-12-2026",
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
  paymentReceivingBranch: "Ambur",
  pickupType:"Home",
  deliveryType: "Normal",

  deliveryStatus: "Pending",
  paymentStatus: "Pending",
});

// ---------------- Row 2 ----------------
await createShipment(2023, "March", {
  date: "02-03-2023",
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
  paymentReceivingBranch: "Ambur",
  pickupType:"Home",
  deliveryType: "Home",

  deliveryStatus: "Pending",
  paymentStatus: "Pending",
});

// ---------------- Row 3 ----------------
await createShipment(2018, "June", {
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
  paymentReceivingBranch: "Chennai",
  pickupType:"Home",
  deliveryType: "Normal",

  deliveryStatus: "Delivered",
  paymentStatus: "Paid",
});

// ---------------- Row 4 ----------------
await createShipment(2014, "June", {
  date: "05-06-2022",
  vehicleNumber: "TN09AB1111",

  fromAmtBranch: "Vellore",
  fromCompany: "PQR Traders",

  toAmtBranch: "Ambur",
  toCompany: "DEF Textiles",

  packageType: "Box",
  quantity: 10,

  pricePerPiece: 150,

  ourInvoiceNumber: "INV004",
  customerInvoiceNumber: "CINV004",

  paymentCompany: "PQR Traders",
  paymentReceivingBranch: "Vellore",
  pickupType:"Home",
  deliveryType: "Home",

  deliveryStatus: "Pending",
  paymentStatus: "Pending",
});

// ---------------- Extra Row 5 ----------------
await createShipment(2026, "July", {
  date: "15-07-2026",
  vehicleNumber: "TN23CZ4321",

  fromAmtBranch: "Ambur",
  fromCompany: "Apex Footwear",

  toAmtBranch: "Bengaluru",
  toCompany: "Global Fashion Hub",

  packageType: "Carton",
  quantity: 8,

  pricePerPiece: 320,

  ourInvoiceNumber: "INV005",
  customerInvoiceNumber: "CINV005",

  paymentCompany: "Apex Footwear",
  paymentReceivingBranch: "Ambur",
  pickupType:"Home",
  deliveryType: "Home",

  deliveryStatus: "In Transit",
  paymentStatus: "Partial",
});

// ---------------- Extra Row 6 ----------------
await createShipment(2026, "July", {
  date: "22-07-2026",
  vehicleNumber: "TN73XY9876",

  fromAmtBranch: "Chennai",
  fromCompany: "Metro Tanneries",

  toAmtBranch: "Peranampattu",
  toCompany: "Royal Leather Co.",

  packageType: "Bale",
  quantity: 15,

  pricePerPiece: 450,

  ourInvoiceNumber: "INV006",
  customerInvoiceNumber: "CINV006",

  paymentCompany: "Royal Leather Co.",
  paymentReceivingBranch: "Peranampattu",
  pickupType:"Home",
  deliveryType: "Normal",

  deliveryStatus: "Delivered",
  paymentStatus: "Paid",
});

console.log("✅ Test Completed");
}

main();








// to test this run this [ npx tsx scripts/excel-test.ts ] in terminal 
