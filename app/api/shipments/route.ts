import { NextRequest, NextResponse } from "next/server";
import { createShipmentsBatch, getShipments, readImageMappings, writeImageMappings } from "@/services/shipment.service";
import type { Shipment, ShipmentFilters, ShipmentPagination } from "@/types/shipment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract pagination params if provided
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");
    const pagination: ShipmentPagination = {};
    if (pageStr && limitStr) {
      pagination.page = parseInt(pageStr, 10);
      pagination.limit = parseInt(limitStr, 10);
    }

    // Extract filter params
    const filters: ShipmentFilters = {};
    const search = searchParams.get("search");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const fromBranch = searchParams.get("fromBranch");
    const toBranch = searchParams.get("toBranch");
    const fromCompany = searchParams.get("fromCompany");
    const toCompany = searchParams.get("toCompany");
    const company = searchParams.get("company");
    const deliveryStatus = searchParams.get("deliveryStatus");
    const paymentStatus = searchParams.get("paymentStatus");
    const vehicleNumber = searchParams.get("vehicleNumber");
    const ourInvoiceNumber = searchParams.get("ourInvoiceNumber");
    const customerInvoiceNumber = searchParams.get("customerInvoiceNumber");
    const packageType = searchParams.get("packageType");
    const pickupService = searchParams.get("pickupService");
    const deliveryService = searchParams.get("deliveryService");

    if (search) filters.search = search;
    if (date) filters.date = date;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (month) filters.month = month;
    if (year) filters.year = year;
    if (fromBranch) filters.fromBranch = fromBranch;
    if (toBranch) filters.toBranch = toBranch;
    if (fromCompany) filters.fromCompany = fromCompany;
    if (toCompany) filters.toCompany = toCompany;
    if (company) filters.company = company;
    if (deliveryStatus) filters.deliveryStatus = deliveryStatus as any;
    if (paymentStatus) filters.paymentStatus = paymentStatus as any;
    if (vehicleNumber) filters.vehicleNumber = vehicleNumber;
    if (ourInvoiceNumber) filters.ourInvoiceNumber = ourInvoiceNumber;
    if (customerInvoiceNumber) filters.customerInvoiceNumber = customerInvoiceNumber;
    if (packageType) filters.packageType = packageType;
    if (pickupService) filters.pickupService = pickupService as any;
    if (deliveryService) filters.deliveryService = deliveryService as any;

    // Extract sorting params
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;
    const sort = sortBy ? { sortBy, sortOrder: sortOrder || "asc" } : undefined;

    const { shipments, total } = await getShipments(filters, pagination, sort);

    const responseJson: any = {
      success: true,
      message: "Shipments fetched successfully.",
      data: shipments,
    };

    if (pagination.page && pagination.limit) {
      responseJson.pagination = {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    }

    return NextResponse.json(responseJson);
  } catch (error: any) {
    console.error("Error GET /api/shipments:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year, month, shipments, imageFileName, uploadSessionId } = body;

    if (!shipments || !Array.isArray(shipments)) {
      return NextResponse.json(
        { error: "Invalid payload. 'shipments' must be an array of records." },
        { status: 400 }
      );
    }

    // Default to current year and month if not provided
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const targetMonth = month || now.toLocaleString("default", { month: "long" });

    // Map the simplified frontend shipment structure to the backend's expected Shipment fields
    const formattedShipments: Shipment[] = shipments.map((s: any) => {
      // Preserve quantity as a string exactly as it appears
      let quantity = "1";
      if (s.quantity !== null && s.quantity !== undefined && s.quantity !== "") {
        quantity = String(s.quantity);
      }

      // Map paymentStatus. The database model type says "Pending" | "Paid" | "Free".
      let paymentStatus: "Pending" | "Paid" | "Free" = "Pending";
      const statusText = String(s.paymentStatus || "").toLowerCase();
      if (statusText.includes("paid")) {
        paymentStatus = "Paid";
      } else if (statusText.includes("free")) {
        paymentStatus = "Free";
      }

      // Build database-aligned Shipment object with sensible default fields
      const shipmentDate = s.date || now.toISOString().split("T")[0]; // YYYY-MM-DD format

      return {
        date: shipmentDate,
        vehicleNumber: s.vehicleNumber || "MOCK-1234",
        fromAmtBranch: s.fromAmtBranch || "HO",
        fromCompany: s.fromCompany || "",
        toAmtBranch: s.toAmtBranch || "BO",
        toCompany: s.toCompany || "",
        packageType: s.packageType || "Box",
        quantity: quantity,
        ourInvoiceNumber: s.ourInvoiceNumber || "",
        customerInvoiceNumber: s.customerInvoice || "",
        paymentCompany: s.paymentCompany || "",
        paymentReceivingBranch: s.paymentReceivingBranch || "",
        pickupService: "Branch",
        deliveryService: "Branch",
        deliveryStatus: "Not Delivered",
        paymentStatus: paymentStatus,
      };
    });

    console.log(`Writing batch of ${formattedShipments.length} shipments to ${targetYear}-${targetMonth}.xlsx`);

    // Call high-performance batch write
    const { results, failed } = await createShipmentsBatch(
      targetYear,
      targetMonth,
      formattedShipments
    );

    // Save image reference metadata mappings
    if (results.length > 0 && imageFileName) {
      try {
        const mappings = readImageMappings();
        const session = uploadSessionId || `US-${Date.now()}`;
        const idx = imageFileName.indexOf("-");
        const originalName = idx !== -1 ? imageFileName.substring(idx + 1) : imageFileName;
        const path = require("path");

        for (const record of results) {
          mappings[record.shipmentId] = {
            uploadSessionId: session,
            imageId: imageFileName,
            imagePath: path.join("storage", "images", imageFileName),
            imageFileName: originalName,
            uploadedAt: new Date().toISOString()
          } as any;
        }
        writeImageMappings(mappings);
      } catch (err) {
        console.error("Error creating image references mappings:", err);
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      totalSaved: results.length,
      failedRows: failed.map((f) => ({
        shipment: {
          fromCompany: f.shipment.fromCompany,
          customerInvoice: f.shipment.customerInvoiceNumber,
          toCompany: f.shipment.toCompany,
          packageType: f.shipment.packageType,
          quantity: f.shipment.quantity,
          paymentStatus: f.shipment.paymentStatus,
        },
        error: f.error,
      })),
    });
  } catch (error: any) {
    console.error("Failed to save shipments to Excel:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
