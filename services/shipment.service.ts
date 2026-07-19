import type { Shipment,ShipmentRecord } from "@/types/shipment";
import { getMonthlyWorkbook } from "@/lib/excel";
import { generateShipmentId } from "@/utils/shipment";

export async function createShipment(
  year: number,
  month: string,
  shipment: Shipment
) {
  const { workbook, workbookPath } = await getMonthlyWorkbook(year, month);

  const worksheet = workbook.getWorksheet("Shipments");


  if (!worksheet) {
    throw new Error("Shipments worksheet not found.");
  }

    // const shipmentId = generateShipmentId(worksheet);
    const shipmentId = await generateShipmentId();
      
    const totalAmount =
  shipment.quantity * shipment.pricePerPiece;

//   worksheet.addRow(shipment);

const shipmentRecord: ShipmentRecord = {
  shipmentId,
  ...shipment,
  totalAmount,
};

// console.log("Before add:", worksheet.rowCount);

// worksheet.addRow(shipmentRecord);

// console.log("After add:", worksheet.rowCount);

// // worksheet.addRow(shipmentRecord);

//   await workbook.xlsx.writeFile(workbookPath);

//   return shipment;

worksheet.addRow(shipmentRecord);

console.log("After add:", worksheet.rowCount);

await workbook.xlsx.writeFile(workbookPath);

console.log("Saved rows:", worksheet.rowCount);

return shipment;
}













