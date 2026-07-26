import { NextRequest, NextResponse } from "next/server";
import { calculateShipmentPricing } from "@/services/pricing.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await calculateShipmentPricing(body);

    return NextResponse.json(result);
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
