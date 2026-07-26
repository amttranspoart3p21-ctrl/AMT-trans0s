import { NextRequest, NextResponse } from "next/server";

import {
  getCompanyRouteRateById,
  updateCompanyRouteRate,
  deleteCompanyRouteRate,
} from "@/services/company-route-rate.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyRouteRateId: string }> }
) {
  try {
    const { companyRouteRateId } = await params;

    const rate = await getCompanyRouteRateById(companyRouteRateId);

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
  { params }: { params: Promise<{ companyRouteRateId: string }> }
) {
  try {
    const { companyRouteRateId } = await params;

    const body = await request.json();

    const rate = await updateCompanyRouteRate(companyRouteRateId, body);

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
  { params }: { params: Promise<{ companyRouteRateId: string }> }
) {
  try {
    const { companyRouteRateId } = await params;

    await deleteCompanyRouteRate(companyRouteRateId);

    return NextResponse.json({
      message: "Company route rate deleted successfully.",
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
