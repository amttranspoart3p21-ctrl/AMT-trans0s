import { NextRequest, NextResponse } from "next/server";

import {
  getGlobalRouteRateById,
  updateGlobalRouteRate,
  deleteGlobalRouteRate,
} from "@/services/global-route-rate.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeRateId: string }> }
) {
  try {
    const { routeRateId } = await params;

    const rate = await getGlobalRouteRateById(routeRateId);

    return NextResponse.json(rate);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ routeRateId: string }> }
) {
  try {
    const { routeRateId } = await params;

    const body = await request.json();

    const rate = await updateGlobalRouteRate(routeRateId, body);

    return NextResponse.json(rate);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routeRateId: string }> }
) {
  try {
    const { routeRateId } = await params;

    await deleteGlobalRouteRate(routeRateId);

    return NextResponse.json({
      message: "Route rate deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 404 }
    );
  }
}
