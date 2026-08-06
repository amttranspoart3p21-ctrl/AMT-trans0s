import { NextRequest, NextResponse } from "next/server";
import { getShipments } from "@/services/shipment.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const year = searchParams.get("year") || undefined;
    const fromBranch = searchParams.get("fromBranch") || undefined;
    const toBranch = searchParams.get("toBranch") || undefined;
    const company = searchParams.get("company") || undefined;

    // Fetch matching shipments without pagination limit to extract all historical packages
    const { shipments } = await getShipments({ month, year, fromBranch, toBranch, company });
    const packageTypes = Array.from(
      new Set(
        shipments
          .map((s) => (s.packageType || "").trim())
          .filter(Boolean)
      )
    );

    return NextResponse.json({ success: true, packages: packageTypes });
  } catch (err: any) {
    console.error("Error loading distinct shipment packages:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
