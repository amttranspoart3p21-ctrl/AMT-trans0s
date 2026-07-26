import { NextRequest, NextResponse } from "next/server";

import {
  createGlobalRouteRate,
  getGlobalRouteRates,
} from "@/services/global-route-rate.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || undefined;
    const limit = Number(searchParams.get("limit")) || undefined;

    const search = searchParams.get("search") || undefined;
    const fromBranchId = searchParams.get("fromBranchId") || undefined;
    const toBranchId = searchParams.get("toBranchId") || undefined;
    const packageId = searchParams.get("packageId") || undefined;

    const status =
      (searchParams.get("status") as
        | "Active"
        | "Inactive"
        | null) ?? undefined;

    const result = await getGlobalRouteRates(
      page,
      limit,
      search,
      fromBranchId,
      toBranchId,
      packageId,
      status
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rate = await createGlobalRouteRate(body);

    return NextResponse.json(rate, {
      status: 201,
    });
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
