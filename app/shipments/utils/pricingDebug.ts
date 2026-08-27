import type { ShipmentRecord } from "@/types/shipment";

export const logPricingDebug = (label: string, s: Partial<ShipmentRecord>) => {
  console.log(`========== [PRICING DEBUG: ${label}] ==========`);
  console.log("Shipment ID     :", s.shipmentId);
  console.log("Package         :", s.packageType);
  console.log("Transport Rate  :", s.transportRate);
  console.log("Pickup Service  :", s.pickupService);
  console.log("Pickup Charge   :", s.pickupCharge);
  console.log("Delivery Service:", s.deliveryService);
  console.log("Delivery Charge :", s.deliveryCharge);
  console.log("Price Per Piece :", s.pricePerPiece);
  console.log("Quantity        :", s.quantity);
  console.log("Total Amount    :", s.totalAmount);
  console.log("===============================================");
};
