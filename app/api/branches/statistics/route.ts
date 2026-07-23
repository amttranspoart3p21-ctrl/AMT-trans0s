import { NextResponse } from "next/server";
import { getBranchStatistics } from "@/services/branch.service";

export async function GET() {
  try {
    const statistics = await getBranchStatistics();

    return NextResponse.json({
      success: true,
      message: "Branch statistics fetched successfully.",
      data: statistics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}