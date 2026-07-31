import type { Shipment, ShipmentRecord } from "@/types/shipment";
import { getMonthlyWorkbook } from "@/lib/excel";
import { generateShipmentId, resolveCompanyNamesInShipment, calculateQuantity, parseYearMonthFromDate } from "@/utils/shipment";
import { SHIPMENT_COLUMNS } from "@/constants/invoice-columns";
import { calculateShipmentPricing } from "@/services/pricing.service";

export async function createShipment(
  year: number,
  month: string,
  shipment: Shipment
) {
  const resolvedShipment = await resolveCompanyNamesInShipment(shipment);

  const { year: derivedYear, month: derivedMonth } = parseYearMonthFromDate(resolvedShipment.date || "");
  const { workbook, workbookPath } = await getMonthlyWorkbook(derivedYear, derivedMonth);

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
      const quantityNum = calculateQuantity(resolvedShipment.quantity);
      totalAmount = (pricePerPiece !== null && pricePerPiece !== undefined)
        ? pricePerPiece * quantityNum
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

export async function createShipmentsBatch(
  year: number,
  month: string,
  shipments: Shipment[]
) {
  const results: ShipmentRecord[] = [];
  const failed: { shipment: Shipment; error: string }[] = [];

  // Group shipments dynamically by derived year/month
  const groups: Record<string, { year: number; month: string; shipments: Shipment[] }> = {};

  for (const shipment of shipments) {
    try {
      const dateVal = shipment.date || "";
      const { year: derivedYear, month: derivedMonth } = parseYearMonthFromDate(dateVal);
      const key = `${derivedYear}-${derivedMonth}`;
      if (!groups[key]) {
        groups[key] = { year: derivedYear, month: derivedMonth, shipments: [] };
      }
      groups[key].shipments.push(shipment);
    } catch (err: any) {
      console.error("Error parsing shipment date in batch:", err);
      failed.push({ shipment, error: err.message || "Invalid Register Date" });
    }
  }

  // Write shipments group by group
  for (const key of Object.keys(groups)) {
    const { year: gYear, month: gMonth, shipments: gShipments } = groups[key];
    try {
      const { workbook, workbookPath } = await getMonthlyWorkbook(gYear, gMonth);

      for (const shipment of gShipments) {
        try {
          const resolvedShipment = await resolveCompanyNamesInShipment(shipment);
          const sheetName = resolvedShipment.date;

          let worksheet = workbook.getWorksheet(sheetName);
          if (!worksheet) {
            worksheet = workbook.addWorksheet(sheetName);
          }

          worksheet.columns = SHIPMENT_COLUMNS;
          const shipmentId = await generateShipmentId();

          let transportRate = resolvedShipment.transportRate;
          let pickupCharge = resolvedShipment.pickupCharge;
          let deliveryCharge = resolvedShipment.deliveryCharge;
          let pricePerPiece = resolvedShipment.pricePerPiece;
          let totalAmount = resolvedShipment.totalAmount;

          if (pricePerPiece === undefined || transportRate === undefined) {
            const calculatedPricing = await calculateShipmentPricing(resolvedShipment);
            transportRate = calculatedPricing.transportRate;
            pickupCharge = calculatedPricing.pickupCharge;
            deliveryCharge = calculatedPricing.deliveryCharge;
            pricePerPiece = calculatedPricing.pricePerPiece;
            totalAmount = calculatedPricing.totalAmount;
          } else {
            if (totalAmount === undefined) {
              const quantityNum = calculateQuantity(resolvedShipment.quantity);
              totalAmount = (pricePerPiece !== null && pricePerPiece !== undefined)
                ? pricePerPiece * quantityNum
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
          results.push(shipmentRecord);
        } catch (err: any) {
          console.error("Error creating shipment row in batch:", err);
          failed.push({ shipment, error: err.message || "Unknown write error" });
        }
      }

      await workbook.xlsx.writeFile(workbookPath);
      console.log(`Saved batch workbook for ${gYear}-${gMonth}.xlsx`);
    } catch (err: any) {
      console.error(`Failed to load/save workbook for group ${key}:`, err);
      for (const s of gShipments) {
        failed.push({ shipment: s, error: `Workbook error: ${err.message}` });
      }
    }
  }

  return { results, failed };
}
