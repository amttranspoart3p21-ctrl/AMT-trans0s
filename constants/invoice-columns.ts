export const SHIPMENT_COLUMNS = [
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
  { header: "Payment Company Name", key: "paymentCompany", width: 25 },             // Optional (Required for Billing)
  { header: "Payment Receiving Branch", key: "paymentReceivingBranch", width: 25 }, 
  { header: "Transport Rate", key: "transportRate", width: 15 },
  { header: "Pickup Charge", key: "pickupCharge", width: 15 },
  { header: "Delivery Charge", key: "deliveryCharge", width: 15 },
  { header: "Price Per Piece", key: "pricePerPiece", width: 15 },               // Optional (Required for Billing)
  { header: "Total Amount", key: "totalAmount", width: 15 },                   // Auto Calculated (Required for Billing)
  
  // --- SECTION 5: OPERATIONAL STATUSES (AT THE END) ---
  { header: "Pickup Service", key: "pickupService", width: 18 }, 
  { header: "Delivery Service", key: "deliveryService", width: 18 },  
  { header: "Delivery Status", key: "deliveryStatus", width: 18 },             // Required (Delivered/Not Delivered...)
  { header: "Payment Status", key: "paymentStatus", width: 15 }                // Required (Paid/Pending/Free)
];
