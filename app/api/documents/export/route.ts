import { NextRequest, NextResponse } from "next/server";
import { getShipments } from "@/services/shipment.service";
import { documentConfigurations } from "@/constants/document-config";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.nextUrl);
    const docType = searchParams.get("type") || "shipment";
    
    // Extract filters
    const filters: any = {};
    const filterKeys = [
      "search", "date", "dateFrom", "dateTo", "fromBranch", "toBranch",
      "deliveryStatus", "paymentStatus", "vehicleNumber", "fromCompany",
      "toCompany", "company", "packageType", "pickupService", "deliveryService",
      "ourInvoiceNumber", "customerInvoiceNumber"
    ];
    filterKeys.forEach(k => {
      const v = searchParams.get(k);
      if (v) filters[k] = v;
    });

    // 1. Fetch shipments from database using the Shipment Service
    const { shipments } = await getShipments(filters);

    // 2. Resolve configuration from shared registry
    const config = documentConfigurations[docType];
    if (!config) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // 3. Generate the Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.title);

    // Gridlines enabled
    worksheet.views = [{ showGridLines: true }];

    // Bind columns
    worksheet.columns = config.columns.map(col => ({
      header: col.header,
      key: col.key,
      width: 20
    }));

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" } // Violet theme color
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    // Add shipment data rows
    shipments.forEach(s => {
      const rowData: any = {};
      config.columns.forEach(col => {
        let val = s[col.key as keyof typeof s];
        if (val === null || val === undefined) {
          val = "";
        }
        rowData[col.key] = val;
      });
      worksheet.addRow(rowData);
    });

    // Cell alignments, border formatting, and styles
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      config.columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        
        // Alignment
        if (col.align === "right") {
          cell.alignment = { horizontal: "right" };
        } else if (col.align === "center") {
          cell.alignment = { horizontal: "center" };
        } else {
          cell.alignment = { horizontal: "left" };
        }

        // Value Formatting
        if (col.format === "currency") {
          cell.numFmt = '₹#,##0';
        } else if (col.format === "date") {
          cell.numFmt = 'yyyy-mm-dd';
        }
        
        // Borders
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      });
    });

    // 4. Append Dynamic Totals at the bottom
    worksheet.addRow([]); // spacer row
    
    // Resolve context values
    const branchName = filters.fromBranch || undefined;
    const companyName = filters.company || filters.fromCompany || filters.toCompany || undefined;

    config.totals.forEach(t => {
      const label = t.label;
      const value = t.calc(shipments, { branchName, companyName });
      
      const totalRow = worksheet.addRow({
        [config.columns[0].key]: label,
        [config.columns[config.columns.length - 1].key]: value
      });

      // Merge label cells across all columns except the last value cell
      if (config.columns.length > 2) {
        worksheet.mergeCells(totalRow.number, 1, totalRow.number, config.columns.length - 1);
      }

      const labelCell = totalRow.getCell(1);
      labelCell.font = { bold: true };
      labelCell.alignment = { horizontal: "right" };

      const valueCell = totalRow.getCell(config.columns.length);
      valueCell.font = { bold: true };
      valueCell.alignment = { horizontal: "right" };
      
      // Totals Borders
      labelCell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "thin", color: { argb: "FF94A3B8" } }
      };
      valueCell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "thin", color: { argb: "FF94A3B8" } }
      };
    });

    // Auto-fit column widths dynamically
    worksheet.columns.forEach(column => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, cell => {
        const value = cell.value ? String(cell.value) : "";
        if (value.length > maxLen) {
          maxLen = value.length;
        }
      });
      column.width = Math.max(maxLen + 4, 15);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${docType}-statement.xlsx"`,
      }
    });

  } catch (err: any) {
    console.error("Error generating Excel document export:", err);
    return NextResponse.json({ error: err.message || "Failed to generate Excel export" }, { status: 500 });
  }
}
