import type { Shipment, ShipmentRecord, ShipmentFilters, ShipmentPagination } from "@/types/shipment";
import { getMonthlyWorkbook } from "@/lib/excel";
import { generateShipmentId, resolveCompanyNamesInShipment, calculateQuantity, parseYearMonthFromDate } from "@/utils/shipment";
import { SHIPMENT_COLUMNS } from "@/constants/invoice-columns";
import { calculateShipmentPricing } from "@/services/pricing.service";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

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

  if (!resolvedShipment.paymentCompany) {
    transportRate = null;
    pickupCharge = null;
    deliveryCharge = null;
    pricePerPiece = null;
    totalAmount = null;
  } else if (
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

          if (!resolvedShipment.paymentCompany) {
            transportRate = null;
            pickupCharge = null;
            deliveryCharge = null;
            pricePerPiece = null;
            totalAmount = null;
          } else if (pricePerPiece === undefined || transportRate === undefined) {
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

// ==========================================
// PHASE 2: EXCEL READ/WRITE & CRUD METHODS
// ==========================================

function isShipmentWorksheet(worksheet: ExcelJS.Worksheet): boolean {
  const cellVal = worksheet.getRow(1).getCell(1).value;
  return cellVal?.toString() === "Shipment ID";
}

const parseNumber = (val: any): number | null => {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const mapRowToShipment = (row: ExcelJS.Row): ShipmentRecord => {
  const record: any = {};
  SHIPMENT_COLUMNS.forEach((col, index) => {
    const cell = row.getCell(index + 1);
    let val = cell.value;
    
    if (val && typeof val === "object" && "result" in val) {
      val = (val as any).result;
    }
    
    if (val instanceof Date) {
      val = val.toISOString().split("T")[0];
    } else if (val === null || val === undefined) {
      val = null;
    } else if (typeof val === "object") {
      val = (val as any).text || JSON.stringify(val);
    }

    const numericKeys = ["transportRate", "pickupCharge", "deliveryCharge", "pricePerPiece", "totalAmount"];
    if (numericKeys.includes(col.key)) {
      record[col.key] = parseNumber(val);
    } else if (col.key === "quantity") {
      record[col.key] = val !== null ? String(val) : "";
    } else {
      record[col.key] = val !== null ? String(val) : "";
    }
  });
  return record as ShipmentRecord;
};

const writeShipmentToRow = (row: ExcelJS.Row, shipment: Partial<ShipmentRecord>) => {
  SHIPMENT_COLUMNS.forEach((col, index) => {
    const key = col.key as keyof ShipmentRecord;
    if (shipment[key] !== undefined) {
      row.getCell(index + 1).value = shipment[key];
    }
  });
};

// ==========================================
// OPTIMIZED WORKBOOK LOADER & TARGET RESOLVER
// ==========================================

export function resolveWorkbookPath(year: number, month: string): string {
  const STORAGE_PATH = path.join(process.cwd(), "storage", "excel");
  const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return path.join(STORAGE_PATH, year.toString(), `${year}-${formattedMonth}.xlsx`);
}

// Reusable workbook loader - central point for future in-memory caching
export async function loadWorkbook(filePath: string): Promise<ExcelJS.Workbook | null> {
  if (!fs.existsSync(filePath)) return null;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

// Loads multiple workbooks in parallel
export async function loadWorkbooks(filePaths: string[]): Promise<{ [path: string]: ExcelJS.Workbook }> {
  const result: { [path: string]: ExcelJS.Workbook } = {};
  await Promise.all(
    filePaths.map(async (fp) => {
      const wb = await loadWorkbook(fp);
      if (wb) {
        result[fp] = wb;
      }
    })
  );
  return result;
}

export function getShipmentsFromWorksheet(worksheet: ExcelJS.Worksheet): ShipmentRecord[] {
  const shipments: ShipmentRecord[] = [];
  if (!isShipmentWorksheet(worksheet)) return [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const shipmentId = row.getCell(1).value?.toString();
    if (shipmentId) {
      shipments.push(mapRowToShipment(row));
    }
  });
  return shipments;
}

export function getShipmentsFromWorkbook(workbook: ExcelJS.Workbook): ShipmentRecord[] {
  const shipments: ShipmentRecord[] = [];
  for (const sheet of workbook.worksheets) {
    shipments.push(...getShipmentsFromWorksheet(sheet));
  }
  return shipments;
}

interface TargetWorkbook {
  year: number;
  month: string;
  workbookPath: string;
}

// Resolves target workbooks dynamically based on date/year/month query parameters
export function getTargetWorkbooks(filters?: ShipmentFilters): TargetWorkbook[] {
  const STORAGE_PATH = path.join(process.cwd(), "storage", "excel");
  const targets: TargetWorkbook[] = [];

  const addTarget = (year: number, monthName: string) => {
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
    const yearPath = path.join(STORAGE_PATH, year.toString());
    const workbookPath = path.join(yearPath, `${year}-${formattedMonth}.xlsx`);
    
    const exists = targets.some(t => t.workbookPath === workbookPath);
    if (!exists && fs.existsSync(workbookPath)) {
      targets.push({
        year,
        month: formattedMonth,
        workbookPath
      });
    }
  };

  const parseDateStr = (clean: string) => {
    try {
      let match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 12);
      
      match = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (match) return new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, 12);

      const parsed = new Date(clean);
      return isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), 12);
    } catch {
      return null;
    }
  };

  // Date filter
  if (filters?.date) {
    const d = parseDateStr(filters.date);
    if (d) {
      addTarget(d.getFullYear(), d.toLocaleString("default", { month: "long" }));
      return targets;
    }
  }

  // Date range filter
  if (filters?.dateFrom || filters?.dateTo) {
    const fromDate = filters.dateFrom ? parseDateStr(filters.dateFrom) : null;
    const toDate = filters.dateTo ? parseDateStr(filters.dateTo) : null;

    if (fromDate || toDate) {
      const start = fromDate || new Date(2000, 0, 1);
      const end = toDate || new Date();

      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      const limit = new Date(end.getFullYear(), end.getMonth(), 1);

      while (current <= limit) {
        addTarget(current.getFullYear(), current.toLocaleString("default", { month: "long" }));
        current.setMonth(current.getMonth() + 1);
      }
      return targets;
    }
  }

  // Year/Month filter
  if (filters?.year || filters?.month) {
    const targetYear = filters.year ? parseInt(filters.year, 10) : null;
    let targetMonth = filters.month ? filters.month.trim() : null;

    if (targetMonth && /^\d+$/.test(targetMonth)) {
      const monthNum = parseInt(targetMonth, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        targetMonth = new Date(2000, monthNum - 1, 1).toLocaleString("default", { month: "long" });
      }
    }

    if (targetYear && targetMonth) {
      addTarget(targetYear, targetMonth);
      return targets;
    }

    if (targetYear) {
      const yearPath = path.join(STORAGE_PATH, targetYear.toString());
      if (fs.existsSync(yearPath)) {
        fs.readdirSync(yearPath).forEach((file) => {
          if (file.endsWith(".xlsx")) {
            const match = file.match(/^\d{4}-([A-Za-z]+)\.xlsx$/);
            if (match) {
              addTarget(targetYear, match[1]);
            }
          }
        });
      }
      return targets;
    }

    if (targetMonth) {
      if (fs.existsSync(STORAGE_PATH)) {
        fs.readdirSync(STORAGE_PATH).forEach((year) => {
          if (/^\d{4}$/.test(year)) {
            addTarget(parseInt(year, 10), targetMonth!);
          }
        });
      }
      return targets;
    }
  }

  // Default fallback: Scan all active folders and files
  if (fs.existsSync(STORAGE_PATH)) {
    fs.readdirSync(STORAGE_PATH).forEach((year) => {
      if (/^\d{4}$/.test(year)) {
        const yearPath = path.join(STORAGE_PATH, year);
        fs.readdirSync(yearPath).forEach((file) => {
          if (file.endsWith(".xlsx")) {
            const match = file.match(/^\d{4}-([A-Za-z]+)\.xlsx$/);
            if (match) {
              addTarget(parseInt(year, 10), match[1]);
            }
          }
        });
      }
    });
  }

  return targets;
}

const MAPPING_FILE = path.join(process.cwd(), "storage", "metadata", "shipment-images.json");

interface ImageMapping {
  uploadSessionId: string;
  imageId: string;
  imagePath: string;
  imageFileName: string;
  uploadedAt: string;
}

export function readImageMappings(): Record<string, ImageMapping> {
  try {
    if (fs.existsSync(MAPPING_FILE)) {
      const content = fs.readFileSync(MAPPING_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading shipment-images mapping file:", err);
  }
  return {};
}

export function writeImageMappings(mappings: Record<string, ImageMapping>) {
  try {
    const dir = path.dirname(MAPPING_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappings, null, 2));
  } catch (err) {
    console.error("Error writing shipment-images mapping file:", err);
  }
}

interface ShipmentLocation {
  workbookPath: string;
  sheetName: string;
  rowNumber: number;
  shipment: ShipmentRecord;
}

export async function findShipmentLocation(shipmentId: string): Promise<ShipmentLocation | null> {
  const targets = getTargetWorkbooks();
  for (const target of targets) {
    const wb = await loadWorkbook(target.workbookPath);
    if (!wb) continue;

    for (const sheet of wb.worksheets) {
      if (!isShipmentWorksheet(sheet)) continue;
      
      let foundRowNumber = -1;
      let foundShipment: ShipmentRecord | null = null;
      
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const currentId = row.getCell(1).value?.toString();
        if (currentId === shipmentId) {
          foundRowNumber = rowNumber;
          foundShipment = mapRowToShipment(row);
        }
      });
      
      if (foundRowNumber !== -1 && foundShipment) {
        const record = foundShipment as ShipmentRecord;
        // Attach image mapping details
        const mappings = readImageMappings();
        const map = mappings[shipmentId];
        if (map && record) {
          record.uploadSessionId = map.uploadSessionId;
          record.imageId = map.imageId;
          record.imagePath = map.imagePath;
          record.imageFileName = map.imageFileName;
        }

        return {
          workbookPath: target.workbookPath,
          sheetName: sheet.name,
          rowNumber: foundRowNumber,
          shipment: foundShipment
        };
      }
    }
  }
  return null;
}

export async function getAllShipments(filters?: ShipmentFilters): Promise<ShipmentRecord[]> {
  const targets = getTargetWorkbooks(filters);
  const filePaths = targets.map(t => t.workbookPath);
  const workbooksMap = await loadWorkbooks(filePaths);
  const mappings = readImageMappings();
  
  const shipments: ShipmentRecord[] = [];
  for (const fp of filePaths) {
    const wb = workbooksMap[fp];
    if (wb) {
      const records = getShipmentsFromWorkbook(wb);
      for (const record of records) {
        const map = mappings[record.shipmentId];
        if (map) {
          record.uploadSessionId = map.uploadSessionId;
          record.imageId = map.imageId;
          record.imagePath = map.imagePath;
          record.imageFileName = map.imageFileName;
        }
        shipments.push(record);
      }
    }
  }
  return shipments;
}

export async function getShipments(
  filters?: ShipmentFilters,
  pagination?: ShipmentPagination,
  sort?: { sortBy: string; sortOrder: "asc" | "desc" }
): Promise<{ shipments: ShipmentRecord[]; total: number }> {
  // Pass filters to getAllShipments so it only loads target workbooks
  let list = await getAllShipments(filters);
  
  // 1. Filtering
  if (filters) {
    if (filters.date) {
      list = list.filter(s => s.date === filters.date);
    }
    if (filters.dateFrom) {
      list = list.filter(s => s.date && s.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      list = list.filter(s => s.date && s.date <= filters.dateTo!);
    }
    if (filters.fromBranch) {
      list = list.filter(s => s.fromAmtBranch.toLowerCase() === filters.fromBranch!.toLowerCase());
    }
    if (filters.toBranch) {
      list = list.filter(s => s.toAmtBranch.toLowerCase() === filters.toBranch!.toLowerCase());
    }
    if (filters.fromCompany) {
      list = list.filter(s => s.fromCompany?.toLowerCase().includes(filters.fromCompany!.toLowerCase()));
    }
    if (filters.toCompany) {
      list = list.filter(s => s.toCompany?.toLowerCase().includes(filters.toCompany!.toLowerCase()));
    }
    if (filters.company) {
      const cVal = filters.company.toLowerCase();
      list = list.filter(s =>
        (s.fromCompany && s.fromCompany.toLowerCase() === cVal) ||
        (s.toCompany && s.toCompany.toLowerCase() === cVal)
      );
    }
    if (filters.deliveryStatus) {
      list = list.filter(s => s.deliveryStatus === filters.deliveryStatus);
    }
    if (filters.paymentStatus) {
      list = list.filter(s => s.paymentStatus === filters.paymentStatus);
    }
    if (filters.vehicleNumber) {
      list = list.filter(s => s.vehicleNumber.toLowerCase().includes(filters.vehicleNumber!.toLowerCase()));
    }
    if (filters.ourInvoiceNumber) {
      list = list.filter(s => s.ourInvoiceNumber.toLowerCase().includes(filters.ourInvoiceNumber!.toLowerCase()));
    }
    if (filters.customerInvoiceNumber) {
      list = list.filter(s => s.customerInvoiceNumber?.toLowerCase().includes(filters.customerInvoiceNumber!.toLowerCase()));
    }
    if (filters.packageType) {
      list = list.filter(s => s.packageType?.toLowerCase().includes(filters.packageType!.toLowerCase()));
    }
    if (filters.pickupService) {
      list = list.filter(s => s.pickupService === filters.pickupService);
    }
    if (filters.deliveryService) {
      list = list.filter(s => s.deliveryService === filters.deliveryService);
    }
    
    // 2. Searching
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s => 
        s.shipmentId.toLowerCase().includes(q) ||
        s.vehicleNumber.toLowerCase().includes(q) ||
        (s.fromCompany && s.fromCompany.toLowerCase().includes(q)) ||
        (s.toCompany && s.toCompany.toLowerCase().includes(q)) ||
        (s.ourInvoiceNumber && s.ourInvoiceNumber.toLowerCase().includes(q)) ||
        (s.customerInvoiceNumber && s.customerInvoiceNumber.toLowerCase().includes(q)) ||
        (s.packageType && s.packageType.toLowerCase().includes(q))
      );
    }
  }
  
  // 3. Sorting
  if (sort && sort.sortBy) {
    const key = sort.sortBy as keyof ShipmentRecord;
    const order = sort.sortOrder === "desc" ? -1 : 1;
    list.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });
  } else {
    // Default sort: latest ID desc
    list.sort((a, b) => b.shipmentId.localeCompare(a.shipmentId));
  }
  
  const total = list.length;
  
  // 4. Pagination
  if (pagination && pagination.page && pagination.limit) {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    list = list.slice(start, end);
  }
  
  return { shipments: list, total };
}

export async function updateShipment(shipmentId: string, updates: Partial<ShipmentRecord>): Promise<ShipmentRecord> {
  const location = await findShipmentLocation(shipmentId);
  if (!location) {
    throw new Error(`Shipment with ID ${shipmentId} not found.`);
  }
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(location.workbookPath);
  const worksheet = workbook.getWorksheet(location.sheetName);
  if (!worksheet) {
    throw new Error(`Worksheet ${location.sheetName} not found in workbook.`);
  }
  
  const row = worksheet.getRow(location.rowNumber);
  
  const updatedShipment = {
    ...location.shipment,
    ...updates,
    shipmentId
  };
  
  let resolvedShipment = updatedShipment;
  if (updates.fromCompany || updates.toCompany || updates.paymentCompany || updates.paymentReceivingBranch) {
    resolvedShipment = await resolveCompanyNamesInShipment(updatedShipment);
  }
  
  if (
    updates.quantity !== undefined ||
    updates.pricePerPiece !== undefined ||
    updates.transportRate !== undefined
  ) {
    const quantityNum = calculateQuantity(resolvedShipment.quantity);
    if (resolvedShipment.pricePerPiece !== null && resolvedShipment.pricePerPiece !== undefined) {
      resolvedShipment.totalAmount = resolvedShipment.pricePerPiece * quantityNum;
    }
  }

  writeShipmentToRow(row, resolvedShipment);
  row.commit();
  
  await workbook.xlsx.writeFile(location.workbookPath);
  return resolvedShipment;
}

export async function bulkUpdateShipments(shipmentIds: string[], updates: Partial<ShipmentRecord>): Promise<ShipmentRecord[]> {
  const results: ShipmentRecord[] = [];
  
  const locations: { [shipmentId: string]: ShipmentLocation } = {};
  for (const id of shipmentIds) {
    const loc = await findShipmentLocation(id);
    if (loc) {
      locations[id] = loc;
    }
  }
  
  const workbooksGroup: { [path: string]: { [shipmentId: string]: ShipmentLocation } } = {};
  for (const id of Object.keys(locations)) {
    const loc = locations[id];
    if (!workbooksGroup[loc.workbookPath]) {
      workbooksGroup[loc.workbookPath] = {};
    }
    workbooksGroup[loc.workbookPath][id] = loc;
  }
  
  for (const wbPath of Object.keys(workbooksGroup)) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(wbPath);
    
    const group = workbooksGroup[wbPath];
    for (const id of Object.keys(group)) {
      const loc = group[id];
      const worksheet = workbook.getWorksheet(loc.sheetName);
      if (worksheet) {
        const row = worksheet.getRow(loc.rowNumber);
        const updatedShipment = {
          ...loc.shipment,
          ...updates,
          shipmentId: id
        };
        
        let resolvedShipment = updatedShipment;
        if (updates.fromCompany || updates.toCompany || updates.paymentCompany || updates.paymentReceivingBranch) {
          resolvedShipment = await resolveCompanyNamesInShipment(updatedShipment);
        }
        
        if (
          updates.quantity !== undefined ||
          updates.pricePerPiece !== undefined ||
          updates.transportRate !== undefined
        ) {
          const quantityNum = calculateQuantity(resolvedShipment.quantity);
          if (resolvedShipment.pricePerPiece !== null && resolvedShipment.pricePerPiece !== undefined) {
            resolvedShipment.totalAmount = resolvedShipment.pricePerPiece * quantityNum;
          }
        }
        
        writeShipmentToRow(row, resolvedShipment);
        row.commit();
        results.push(resolvedShipment);
      }
    }
    
    await workbook.xlsx.writeFile(wbPath);
  }
  
  return results;
}

export async function deleteShipment(shipmentId: string): Promise<boolean> {
  const location = await findShipmentLocation(shipmentId);
  if (!location) {
    return false;
  }
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(location.workbookPath);
  const worksheet = workbook.getWorksheet(location.sheetName);
  if (!worksheet) {
    return false;
  }
  
  worksheet.spliceRows(location.rowNumber, 1);
  await workbook.xlsx.writeFile(location.workbookPath);

  // Clean up image reference mapping registry
  try {
    const mappings = readImageMappings();
    if (mappings[shipmentId]) {
      delete mappings[shipmentId];
      writeImageMappings(mappings);
    }
  } catch (err) {
    console.error("Error cleaning up image mapping on deletion:", err);
  }

  return true;
}
