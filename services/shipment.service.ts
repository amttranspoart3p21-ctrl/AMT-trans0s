import type { Shipment, ShipmentRecord } from "@/types/shipment";
import { getMonthlyWorkbook } from "@/lib/excel";
import { generateShipmentId, resolveCompanyNamesInShipment } from "@/utils/shipment";
import { SHIPMENT_COLUMNS } from "@/constants/invoice-columns";
import { calculateShipmentPricing } from "@/services/pricing.service";

export async function createShipment(
  year: number,
  month: string,
  shipment: Shipment
) {
  const { workbook, workbookPath } = await getMonthlyWorkbook(year, month);

  const resolvedShipment = await resolveCompanyNamesInShipment(shipment);

  const sheetName = resolvedShipment.date;

  let worksheet = workbook.getWorksheet(sheetName);

  if (!worksheet) {
    worksheet = workbook.addWorksheet(sheetName);
  }

  worksheet.columns = SHIPMENT_COLUMNS;

  const shipmentId = await generateShipmentId();

  // If pricing breakdown or pricePerPiece is not explicitly passed, calculate pricing automatically via 3-step pricing service
  let transportRate = resolvedShipment.transportRate;
  let pickupCharge = resolvedShipment.pickupCharge;
  let deliveryCharge = resolvedShipment.deliveryCharge;
  let pricePerPiece = resolvedShipment.pricePerPiece;
  let totalAmount = resolvedShipment.totalAmount;

  if (
    pricePerPiece === undefined ||
    transportRate === undefined
  ) {
    const calculatedPricing = await calculateShipmentPricing(resolvedShipment);
    transportRate = calculatedPricing.transportRate;
    pickupCharge = calculatedPricing.pickupCharge;
    deliveryCharge = calculatedPricing.deliveryCharge;
    pricePerPiece = calculatedPricing.pricePerPiece;
    totalAmount = calculatedPricing.totalAmount;
  } else {
    if (totalAmount === undefined) {
      totalAmount = (pricePerPiece !== null && pricePerPiece !== undefined)
        ? pricePerPiece * (resolvedShipment.quantity || 1)
        : null;
    }
  }

  const shipmentRecord: ShipmentRecord = {
    ...resolvedShipment,
    shipmentId,
    transportRate: transportRate !== undefined ? transportRate : null,
    pickupCharge: pickupCharge !== undefined ? pickupCharge : null,
    deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : null,
    pricePerPiece: pricePerPiece !== undefined ? pricePerPiece : null,
    totalAmount: totalAmount !== undefined ? totalAmount : null,
  };

  worksheet.addRow(shipmentRecord);

  console.log(`After add to sheet ${sheetName}:`, worksheet.rowCount);

  await workbook.xlsx.writeFile(workbookPath);

  console.log(`Saved rows in sheet ${sheetName}:`, worksheet.rowCount);

  return shipmentRecord;
}
