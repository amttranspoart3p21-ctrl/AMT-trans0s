import { NextRequest, NextResponse } from "next/server";

import {
  getPackageById,
  updatePackage,
  deletePackage,
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

    await deletePackage(packageId);

    return NextResponse.json({
      message: "Package deleted successfully.",
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