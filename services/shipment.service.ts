import type { Shipment, ShipmentRecord } from "@/types/shipment";
import { getMonthlyWorkbook } from "@/lib/excel";
import { generateShipmentId } from "@/utils/shipment";
import { SHIPMENT_COLUMNS } from "@/constants/invoice-columns";
import { calculateShipmentPricing } from "@/services/pricing.service";

export async function createShipment(
  year: number,
  month: string,
  shipment: Shipment
) {
  const { workbook, workbookPath } = await getMonthlyWorkbook(year, month);

  const sheetName = shipment.date;

  let worksheet = workbook.getWorksheet(sheetName);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(sheetName);
  }

  worksheet.columns = SHIPMENT_COLUMNS;

  const shipmentId = await generateShipmentId();

  // If pricing breakdown or pricePerPiece is not explicitly passed, calculate pricing automatically via 3-step pricing service
  let transportRate = shipment.transportRate;
  let pickupCharge = shipment.pickupCharge;
  let deliveryCharge = shipment.deliveryCharge;
  let pricePerPiece = shipment.pricePerPiece;
  let totalAmount = shipment.totalAmount;

  if (
    typeof pricePerPiece !== "number" ||
    pricePerPiece === 0 ||
    typeof transportRate !== "number" ||
    (transportRate === 0 && pickupCharge === 0 && deliveryCharge === 0 && pricePerPiece === 0)
  ) {
    const calculatedPricing = await calculateShipmentPricing(shipment);
    transportRate = calculatedPricing.transportRate;
    pickupCharge = calculatedPricing.pickupCharge;
    deliveryCharge = calculatedPricing.deliveryCharge;
    pricePerPiece = calculatedPricing.pricePerPiece;
    totalAmount = calculatedPricing.totalAmount;
  } else {
    totalAmount = shipment.totalAmount ?? (shipment.quantity || 1) * pricePerPiece;
  }

  const shipmentRecord: ShipmentRecord = {
    ...shipment,
    shipmentId,
    transportRate: transportRate ?? 0,
    pickupCharge: pickupCharge ?? 0,
    deliveryCharge: deliveryCharge ?? 0,
    pricePerPiece: pricePerPiece ?? 0,
    totalAmount: totalAmount ?? 0,
  };

  worksheet.addRow(shipmentRecord);

  console.log(`After add to sheet ${sheetName}:`, worksheet.rowCount);

  await workbook.xlsx.writeFile(workbookPath);

  console.log(`Saved rows in sheet ${sheetName}:`, worksheet.rowCount);

  return shipmentRecord;
}
