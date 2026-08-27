import type { ShipmentRecord } from "@/types/shipment";

export const EDITABLE_COLUMNS: Array<keyof ShipmentRecord> = [
  "date",
  "vehicleNumber",
  "fromAmtBranch",
  "fromCompany",
  "toAmtBranch",
  "toCompany",
  "ourInvoiceNumber",
  "customerInvoiceNumber",
  "packageType",
  "quantity",
  "pickupService",
  "deliveryService",
  "paymentReceivingBranch",
  "paymentCompany",
  "transportRate",
  "pickupCharge",
  "deliveryCharge",
  "pricePerPiece",
  "totalAmount",
  "deliveryStatus",
  "paymentStatus"
];
