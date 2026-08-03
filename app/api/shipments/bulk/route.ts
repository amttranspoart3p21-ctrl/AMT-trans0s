import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateShipments } from "@/services/shipment.service";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
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
