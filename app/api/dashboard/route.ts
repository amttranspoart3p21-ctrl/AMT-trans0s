import { NextResponse } from "next/server";
import { getMasterDashboardStats } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getMasterDashboardStats();

    return NextResponse.json({
      success: true,
      message: "Master dashboard statistics fetched successfully.",
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load dashboard statistics.",
      },
      { status: 500 }
    );
  }
}
