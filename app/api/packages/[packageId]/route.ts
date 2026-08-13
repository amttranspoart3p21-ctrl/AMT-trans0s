import { NextRequest, NextResponse } from "next/server";

import {
  getPackageById,
  updatePackage,
  deletePackage,
  inactivePackage,
  activatePackage,
} from "@/services/package.service";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const pkg = await getPackageById(packageId);

    return NextResponse.json(pkg);
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
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const body = await request.json();

    if (body.status === "Inactive") {
      const { updatedPackage, isGlobal, updatedCounts } = await inactivePackage(packageId);

      return NextResponse.json({
        success: true,
        message: isGlobal
          ? "Global package and related records marked inactive"
          : "Company package and related records marked inactive",
        updated: updatedCounts,
        data: updatedPackage,
      });
    } else if (body.status === "Active") {
      const { updatedPackage, isGlobal, updatedCounts } = await activatePackage(packageId);

      return NextResponse.json({
        success: true,
        message: isGlobal
          ? "Global package and related records marked active"
          : "Company package and related records marked active",
        updated: updatedCounts,
        data: updatedPackage,
      });
    }

    const pkg = await updatePackage(packageId, body);

    return NextResponse.json(pkg);
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
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const { deletedPackage, isGlobal, deletedCounts } = await deletePackage(packageId);

    return NextResponse.json({
      success: true,
      message: isGlobal
        ? "Global package deleted successfully"
        : "Company package deleted successfully",
      deleted: deletedCounts,
      data: deletedPackage,
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