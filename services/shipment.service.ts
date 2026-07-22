// we import this for types  its integer or string like that bicically (Typescript)
import type { Shipment, ShipmentRecord } from "@/types/shipment";
//we import this for get the excel file path 
import { getMonthlyWorkbook, SHIPMENT_COLUMNS } from "@/lib/excel";
//this is used for auto generated the unique id for  WEB SITE 'CRUD'OPERATIONS
import { generateShipmentId } from "@/utils/shipment";

export async function createShipment(

  // This function needs
  year: number,         // year → 2026 (means in number)
  month: string,        // month → July (means in string)
  shipment: Shipment    // shipment →  its contain the object 
) {

  // this means open example 2026/July.xlsx
  const { workbook, workbookPath } = await getMonthlyWorkbook(year, month);
  
  // The sheet name is based on the shipment's exact date (DD-MM-YYYY)
  const sheetName = shipment.date;

  // Check whether a worksheet with that exact date already exists
  let worksheet = workbook.getWorksheet(sheetName);

  if (!worksheet) {
    // Create a new worksheet using the date as the sheet name
    worksheet = workbook.addWorksheet(sheetName);
  }

  // Set the column definitions (this applies headers if it's new, and sets key mappings)
  worksheet.columns = SHIPMENT_COLUMNS;

  const shipmentId = await generateShipmentId();

  const totalAmount =
    shipment.quantity * shipment.pricePerPiece;
  const shipmentRecord: ShipmentRecord = {
    shipmentId,
    ...shipment,
    totalAmount,
  };

  worksheet.addRow(shipmentRecord);

  console.log(`After add to sheet ${sheetName}:`, worksheet.rowCount);

  await workbook.xlsx.writeFile(workbookPath);

  console.log(`Saved rows in sheet ${sheetName}:`, worksheet.rowCount);

  return shipment;
}













