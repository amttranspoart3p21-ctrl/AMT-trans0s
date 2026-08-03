import { NextRequest, NextResponse } from "next/server";
import { findShipmentLocation, updateShipment, deleteShipment } from "@/services/shipment.service";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { shipmentId } = await params;
    const location = await findShipmentLocation(shipmentId);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          message: `Shipment with ID ${shipmentId} not found.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shipment fetched successfully.",
      data: location.shipment,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { shipmentId } = await params;
    const body = await request.json();

    const updated = await updateShipment(shipmentId, body);

    return NextResponse.json({
      success: true,
      message: "Shipment updated successfully.",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { shipmentId } = await params;
    const success = await deleteShipment(shipmentId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: `Shipment with ID ${shipmentId} not found or could not be deleted.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shipment deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}
