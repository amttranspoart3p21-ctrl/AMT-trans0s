import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateShipments, bulkUpdateSpreadsheetRows } from "@/services/shipment.service";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support row-specific spreadsheet batch updates
    if (body.rows && Array.isArray(body.rows)) {
      const { rows } = body;
      console.log("========== [BACKEND PRICING DEBUG: Incoming Payload] ==========");
      console.log("Rows Payload:", JSON.stringify(rows, null, 2));
      console.log("=============================================================");

      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No modifications to save.",
          data: [],
        });
      }
      
      const updatedShipments = await bulkUpdateSpreadsheetRows(rows);
      console.log("========== [BACKEND PRICING DEBUG: Updated Shipments Result] ==========");
      console.log("Updated Shipments:", JSON.stringify(updatedShipments, null, 2));
      console.log("=====================================================================");

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updatedShipments.length} shipments.`,
        data: updatedShipments,
      });
    }

    const { shipmentIds, updates } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'shipmentIds' must be a non-empty array." },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'updates' must be a non-empty object." },
        { status: 400 }
      );
    }

    const updatedShipments = await bulkUpdateShipments(shipmentIds, updates);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedShipments.length} shipments.`,
      data: updatedShipments,
    });
  } catch (error: any) {
    console.error("Error PUT /api/shipments/bulk:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
